import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as geofire from 'geofire-common';
import { DispatchSettings } from './types';
import { requireAuth, requireSelfOrAdmin, isAdminUser } from './auth-helpers';

const db = admin.firestore();

// Default dispatch configuration
const DEFAULT_DISPATCH_SETTINGS: DispatchSettings = {
  initialRadius: 3,
  maxRadius: 10,
  offerTimeoutSec: 30,
  batchSize: 3,
  weights: {
    distance: 0.40,
    rating: 0.25,
    acceptRate: 0.15,
    idleTime: 0.10,
    premiumBonus: 0.10
  }
};

/**
 * 48. onJobCreated Firestore trigger
 * Triggered when a new job is created in Firestore `jobs/{jobId}`
 */
export const onJobCreated = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const jobData = snap.data();
    const jobId = context.params.jobId;

    if (!jobData || (jobData.status !== 'pending' && jobData.status !== 'searching' && jobData.status !== 'requested')) {
      return null;
    }

    const customerLocation = jobData.location || jobData.customerLocation;
    const categoryId = jobData.categoryId || jobData.category;
    if (!customerLocation || !customerLocation.lat || !customerLocation.lng || !categoryId) {
      console.warn(`Job ${jobId} missing location or categoryId`);
      return null;
    }

    // Load dispatch settings
    const settingsSnap = await db.collection('settings').doc('platform').get();
    const settings: DispatchSettings = settingsSnap.exists && settingsSnap.data()?.dispatch
      ? { ...DEFAULT_DISPATCH_SETTINGS, ...settingsSnap.data()?.dispatch }
      : DEFAULT_DISPATCH_SETTINGS;

    // Search workers around initial radius
    const center: [number, number] = [customerLocation.lat, customerLocation.lng];
    const radiusInM = settings.initialRadius * 1000;
    const bounds = geofire.geohashQueryBounds(center, radiusInM);

    const workerCandidates: Array<{
      id: string;
      data: FirebaseFirestore.DocumentData;
      distanceKm: number;
      score: number;
    }> = [];

    for (const b of bounds) {
      const q = await db.collection('workers')
        .where('isOnline', '==', true)
        .where('categoryIds', 'array-contains', categoryId)
        .orderBy('homeLocation.geohash')
        .startAt(b[0])
        .endAt(b[1])
        .get();

      for (const doc of q.docs) {
        const worker = doc.data();
        const verStatus = worker.verificationStatus || worker.status;
        if (verStatus !== 'approved') continue;
        if (worker.isBusy || worker.currentJobId) continue; // Busy

        const lat = worker.currentLocation?.lat || worker.homeLocation?.lat;
        const lng = worker.currentLocation?.lng || worker.homeLocation?.lng;
        if (lat == null || lng == null) continue;

        const distanceInKm = geofire.distanceBetween([lat, lng], center);
        if (distanceInKm > settings.initialRadius) continue;

        // Dispatch scoring: distance(0.40), rating(0.25), acceptRate(0.15), idleTime(0.10), premium(0.10)
        const distScore = Math.max(0, 1 - (distanceInKm / settings.initialRadius));
        const ratingScore = Math.min(1, (worker.rating || 4.0) / 5.0);
        const rawAccept = Number(worker.acceptRate ?? 0.8);
        const acceptScore = rawAccept <= 1 ? rawAccept : rawAccept / 100;
        const idleScore = Math.min(1, ((Date.now() - (worker.lastJobCompletedAt ? new Date(worker.lastJobCompletedAt).getTime() : 0)) / (3600000 * 2)));
        const premiumScore = worker.isPremium ? 1.0 : 0.0;

        const score =
          (distScore * settings.weights.distance) +
          (ratingScore * settings.weights.rating) +
          (acceptScore * settings.weights.acceptRate) +
          (idleScore * settings.weights.idleTime) +
          (premiumScore * settings.weights.premiumBonus);

        workerCandidates.push({
          id: doc.id,
          data: worker,
          distanceKm: distanceInKm,
          score
        });
      }
    }

    // Sort by score descending
    workerCandidates.sort((a, b) => b.score - a.score);
    const topBatch = workerCandidates.slice(0, settings.batchSize);

    if (topBatch.length === 0) {
      console.log(`No free workers found for job ${jobId} in radius ${settings.initialRadius}km. Posting to board.`);
      await snap.ref.update({
        status: 'broadcast',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return null;
    }

    // 50. Create offers subcollection with 30s timeout
    const batch = db.batch();
    const expiresAt = new Date(Date.now() + settings.offerTimeoutSec * 1000).toISOString();

    for (const w of topBatch) {
      const offerRef = snap.ref.collection('offers').doc(w.id);
      batch.set(offerRef, {
        workerId: w.id,
        workerName: w.data.name || 'কর্মী',
        jobId,
        score: w.score,
        distanceKm: Number(w.distanceKm.toFixed(2)),
        status: 'pending',
        expiresAt,
        createdAt: new Date().toISOString()
      });
    }

    batch.update(snap.ref, {
      status: 'offered',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    return null;
  });

/**
 * 52. acceptJob with Firestore transaction
 * Ensures only the first worker gets the job atomically.
 */
export const acceptJob = functions.https.onCall(async (data, context) => {
  const { jobId, workerId } = data;
  if (!jobId || !workerId) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId and workerId are required');
  }
  requireSelfOrAdmin(context, workerId);

  const jobRef = db.collection('jobs').doc(jobId);
  const workerRef = db.collection('workers').doc(workerId);

  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Job not found');
    }

    const job = jobDoc.data()!;
    const acceptableStatuses = ['offered', 'broadcast', 'searching', 'pending'];
    if (!acceptableStatuses.includes(job.status) || job.workerId) {
      throw new functions.https.HttpsError('failed-precondition', 'Job is no longer available');
    }

    const workerDoc = await transaction.get(workerRef);
    if (!workerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Worker not found');
    }

    const worker = workerDoc.data()!;
    if (worker.isBusy || worker.currentJobId) {
      throw new functions.https.HttpsError('failed-precondition', 'Worker is already busy with another job');
    }

    // Assign worker and transition status
    transaction.update(jobRef, {
      workerId,
      workerName: worker.name || 'কর্মী',
      workerPhone: worker.phone || '',
      status: 'accepted',
      'timeline.acceptedAt': new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    transaction.update(workerRef, {
      isBusy: true,
      currentJobId: jobId
    });

    return { success: true, message: 'Job accepted successfully' };
  });
});

/**
 * 53. grabBoardJob
 */
export const grabBoardJob = functions.https.onCall(async (data, context) => {
  const { jobId, workerId } = data;
  if (!jobId || !workerId) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId and workerId are required');
  }
  requireSelfOrAdmin(context, workerId);

  const jobRef = db.collection('jobs').doc(jobId);
  const workerRef = db.collection('workers').doc(workerId);

  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    const jobData = jobDoc.data();
    const grabbable = jobData && ['broadcast', 'searching', 'pending'].includes(jobData.status) && !jobData.workerId;
    if (!jobDoc.exists || !grabbable) {
      throw new functions.https.HttpsError('failed-precondition', 'Job was taken by another worker');
    }

    const workerDoc = await transaction.get(workerRef);
    if (!workerDoc.exists || workerDoc.data()?.isBusy || workerDoc.data()?.currentJobId) {
      throw new functions.https.HttpsError('failed-precondition', 'Worker is busy');
    }

    const worker = workerDoc.data()!;
    transaction.update(jobRef, {
      workerId,
      workerName: worker.name || 'কর্মী',
      workerPhone: worker.phone || '',
      status: 'accepted',
      'timeline.acceptedAt': new Date().toISOString()
    });

    transaction.update(workerRef, {
      isBusy: true,
      currentJobId: jobId
    });

    return { success: true };
  });
});

/**
 * 53. submitBid and chooseBid
 */
export const submitBid = functions.https.onCall(async (data, context) => {
  const { jobId, bid } = data;
  if (!jobId || !bid || !bid.workerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing bid data');
  }
  requireSelfOrAdmin(context, bid.workerId);

  const jobRef = db.collection('jobs').doc(jobId);
  const jobDoc = await jobRef.get();
  if (!jobDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Job not found');
  }

  const newBid = {
    id: `bid_${Date.now()}`,
    ...bid,
    createdAt: new Date().toISOString()
  };

  await jobRef.update({
    bids: admin.firestore.FieldValue.arrayUnion(newBid)
  });

  return { success: true, bid: newBid };
});

export const chooseBid = functions.https.onCall(async (data, context) => {
  const callerUid = requireAuth(context);
  const { jobId, bidId } = data;
  if (!jobId || !bidId) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId and bidId are required');
  }
  const jobRef = db.collection('jobs').doc(jobId);

  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) throw new functions.https.HttpsError('not-found', 'Job not found');
    const job = jobDoc.data()!;

    if (job.customerId !== callerUid && !isAdminUser(context)) {
      throw new functions.https.HttpsError('permission-denied', 'Only the job customer or admin can choose a bid.');
    }

    const selectedBid = (job.bids || []).find((b: any) => b.id === bidId);
    if (!selectedBid) {
      throw new functions.https.HttpsError('not-found', 'Bid not found');
    }

    transaction.update(jobRef, {
      workerId: selectedBid.workerId,
      workerName: selectedBid.workerName,
      estimatedPrice: selectedBid.amount,
      finalPrice: selectedBid.amount,
      status: 'accepted',
      'timeline.acceptedAt': new Date().toISOString()
    });

    const workerRef = db.collection('workers').doc(selectedBid.workerId);
    transaction.update(workerRef, {
      isBusy: true,
      currentJobId: jobId
    });

    return { success: true };
  });
});

/**
 * 54. updateJobStatus with start OTP check
 */
export const updateJobStatus = functions.https.onCall(async (data, context) => {
  const callerUid = requireAuth(context);
  const { jobId, newStatus, otp } = data;
  if (!jobId || !newStatus) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId and newStatus are required');
  }
  const jobRef = db.collection('jobs').doc(jobId);
  const jobDoc = await jobRef.get();

  if (!jobDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Job not found');
  }

  const job = jobDoc.data()!;
  if (callerUid !== job.customerId && callerUid !== job.workerId && !isAdminUser(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this job.');
  }

  // Verify start OTP when starting work (supports startOtp and legacy startOTP)
  if (newStatus === 'in_progress') {
    const expectedOtp = job.startOtp ?? job.startOTP;
    if (!otp || String(otp).trim() !== String(expectedOtp).trim()) {
      throw new functions.https.HttpsError('permission-denied', 'ভুল স্টার্ট ওটিপি! সঠিক ৪-সংখ্যার কোড দিন।');
    }
  }

  await jobRef.update({
    status: newStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, status: newStatus };
});

/**
 * 55. completeJob: Completion OTP check, final bill, commission deduction, transaction record
 */
export const completeJob = functions.https.onCall(async (data, context) => {
  const callerUid = requireAuth(context);
  const { jobId, materialCost, finalUnits, completionOtp, finalPrice } = data;
  if (!jobId) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId is required');
  }
  const jobRef = db.collection('jobs').doc(jobId);

  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) throw new functions.https.HttpsError('not-found', 'Job not found');
    const job = jobDoc.data()!;

    if (callerUid !== job.workerId && !isAdminUser(context)) {
      throw new functions.https.HttpsError('permission-denied', 'Only the assigned worker or admin can complete this job.');
    }

    const expectedCompletionOtp = job.completionOtp || job.startOtp || job.startOTP;
    if (expectedCompletionOtp && !isAdminUser(context)) {
      if (!completionOtp || String(completionOtp).trim() !== String(expectedCompletionOtp).trim()) {
        throw new functions.https.HttpsError('permission-denied', 'ভুল সমাপনী OTP! কাস্টমারের কাছ থেকে সঠিক ৪-সংখ্যার কোড নিন।');
      }
    }

    const workerRef = db.collection('workers').doc(job.workerId);
    const workerDoc = await transaction.get(workerRef);
    const worker = workerDoc.exists ? workerDoc.data()! : {};

    // Calculate final bill: base + rate*units + material + platformFee - coupon
    const baseRate = Number(finalPrice || job.finalPrice || job.estimatedPrice || job.price || 350);
    const units = Number(finalUnits || 1);
    const materials = Number(materialCost ?? job.materialCost ?? 0);
    const platformFee = 20;
    const couponDiscount = Number(job.couponDiscount || 0);

    const totalBill = (baseRate * units) + materials + platformFee - couponDiscount;
    const commissionRate = worker.isPremium ? 0.10 : 0.15; // Pro badge gets 10% commission
    const commissionAmount = Math.round(baseRate * units * commissionRate);
    const workerEarning = totalBill - commissionAmount;

    // Update job
    transaction.update(jobRef, {
      status: 'completed',
      finalPrice: totalBill,
      materialCost: materials,
      commission: commissionAmount,
      platformFee,
      workerEarning,
      'timeline.completedAt': new Date().toISOString()
    });

    // Update worker: release busy, update wallet due & total earnings (flat WorkerProfile schema)
    transaction.update(workerRef, {
      isBusy: false,
      currentJobId: null,
      commissionDue: admin.firestore.FieldValue.increment(commissionAmount),
      walletBalance: admin.firestore.FieldValue.increment(workerEarning),
      totalJobs: admin.firestore.FieldValue.increment(1),
      lastJobCompletedAt: new Date().toISOString()
    });

    // Create transaction record
    const transRef = db.collection('transactions').doc(`tx_${Date.now()}`);
    transaction.set(transRef, {
      jobId,
      workerId: job.workerId,
      customerId: job.customerId,
      amount: totalBill,
      commission: commissionAmount,
      type: 'commission_due',
      createdAt: new Date().toISOString()
    });

    return { success: true, totalBill, commissionAmount };
  });
});

/**
 * 56. cancelJob: Cancellation rules (free within 2 min or before departure; ৳50 fee after departure)
 */
export const cancelJob = functions.https.onCall(async (data, context) => {
  const callerUid = requireAuth(context);
  const { jobId, reason } = data;
  if (!jobId) {
    throw new functions.https.HttpsError('invalid-argument', 'jobId is required');
  }
  const jobRef = db.collection('jobs').doc(jobId);

  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) throw new functions.https.HttpsError('not-found', 'Job not found');
    const job = jobDoc.data()!;

    if (callerUid !== job.customerId && callerUid !== job.workerId && !isAdminUser(context)) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to cancel this job.');
    }

    const actor = callerUid === job.workerId ? 'worker' : 'customer';

    let fee = 0;
    const isWorkerOnTheWay = job.status === 'on_the_way' || job.status === 'arrived';
    if (actor === 'customer' && isWorkerOnTheWay) {
      fee = 50; // ৳50 cancellation fee
    }

    transaction.update(jobRef, {
      status: actor === 'worker' ? 'cancelled_by_worker' : 'cancelled_by_customer',
      cancelReason: reason || 'বাতিল করা হয়েছে',
      cancelledBy: actor,
      cancellationFee: fee,
      'timeline.cancelledAt': new Date().toISOString()
    });

    if (job.workerId) {
      const workerRef = db.collection('workers').doc(job.workerId);
      transaction.update(workerRef, {
        isBusy: false,
        currentJobId: null
      });
    }

    return { success: true, fee };
  });
});

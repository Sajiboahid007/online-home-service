import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * 107. autoOfflineStaleWorkers: Runs every 5 minutes
 * Turns off workers whose location/heartbeat has stalled for > 10 minutes
 */
export const autoOfflineStaleWorkers = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const staleSnap = await db.collection('workers')
      .where('isOnline', '==', true)
      .where('lastHeartbeat', '<', tenMinutesAgo)
      .get();

    if (staleSnap.empty) {
      console.log('No stale workers found.');
      return null;
    }

    const batch = db.batch();
    staleSnap.docs.forEach(doc => {
      batch.update(doc.ref, {
        isOnline: false,
        offlineReason: 'inactivity_timeout'
      });
    });

    await batch.commit();
    console.log(`Switched ${staleSnap.size} stale workers offline.`);
    return null;
  });

/**
 * 108. liftExpiredSuspensions: Runs every 1 hour
 * Automatically restores accounts after temporary suspensions expire
 */
export const liftExpiredSuspensions = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const nowIso = new Date().toISOString();

    const expiredSnap = await db.collection('users')
      .where('status', '==', 'suspended')
      .where('suspendedUntil', '<=', nowIso)
      .get();

    if (expiredSnap.empty) {
      return null;
    }

    const batch = db.batch();
    for (const doc of expiredSnap.docs) {
      batch.update(doc.ref, {
        status: 'active',
        banReason: admin.firestore.FieldValue.delete(),
        suspendedUntil: admin.firestore.FieldValue.delete()
      });

      // Lift Firebase Auth banned custom claim
      try {
        await admin.auth().setCustomUserClaims(doc.id, { banned: false });
      } catch (e) {
        console.warn(`Failed to clear custom claims for ${doc.id}:`, e);
      }
    }

    await batch.commit();
    console.log(`Lifted suspension for ${expiredSnap.size} accounts.`);
    return null;
  });

/**
 * 109. dailyReport: Runs every midnight (every 24 hours)
 * Computes daily metrics: completed jobs, gross merchandise value (GMV), platform commission
 */
export const dailyReport = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = `${today}T00:00:00.000Z`;

    const completedJobsSnap = await db.collection('jobs')
      .where('status', '==', 'completed')
      .where('completedAt', '>=', startOfDay)
      .get();

    let gmv = 0;
    let totalCommission = 0;
    let count = 0;

    completedJobsSnap.forEach(doc => {
      const data = doc.data();
      gmv += data.finalBill || data.price || 0;
      totalCommission += data.commissionAmount || 0;
      count++;
    });

    const reportRef = db.collection('dailyReports').doc(`report_${today}`);
    await reportRef.set({
      date: today,
      completedJobs: count,
      grossRevenue: gmv,
      platformCommission: totalCommission,
      generatedAt: new Date().toISOString()
    });

    console.log(`Generated daily report for ${today}: ${count} jobs, GMV: ৳${gmv}`);
    return null;
  });

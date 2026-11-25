import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { requireAuth, requireAdmin } from './auth-helpers';

const db = admin.firestore();

/**
 * 70. submitReview: Calculate worker's average rating on the server
 */
export const submitReview = functions.https.onCall(async (data, context) => {
  const reviewerId = requireAuth(context);
  const { jobId, workerId, rating, comment, isWorkerReview } = data;

  const numericRating = Number(rating);
  if (!jobId || !workerId || !numericRating || numericRating < 1 || numericRating > 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid jobId, workerId, and rating (1-5) are required.');
  }

  const reviewRef = db.collection('reviews').doc(`rev_${Date.now()}`);
  const newReview = {
    jobId,
    workerId,
    reviewerId,
    rating: numericRating,
    comment: comment || '',
    isWorkerReview: !!isWorkerReview,
    createdAt: new Date().toISOString()
  };

  await reviewRef.set(newReview);

  // Recalculate average rating of worker from last 50 reviews
  const reviewsSnap = await db.collection('reviews')
    .where('workerId', '==', workerId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  let totalRating = 0;
  let count = 0;
  reviewsSnap.forEach(doc => {
    const r = doc.data();
    if (r.rating) {
      totalRating += r.rating;
      count++;
    }
  });

  const avgRating = count > 0 ? Number((totalRating / count).toFixed(2)) : 5.0;

  const workerRef = db.collection('workers').doc(workerId);
  await workerRef.update({
    rating: avgRating,
    ratingCount: count
  });

  // 71. Auto-ban check
  await checkAutoBan(workerId, avgRating, count);

  return { success: true, avgRating, reviewCount: count };
});

/**
 * 71. checkAutoBan: Apply suspension/warning rules based on rating and cancellation
 */
async function checkAutoBan(workerId: string, rating: number, reviewCount: number): Promise<void> {
  if (reviewCount < 5) return; // Need at least 5 reviews to evaluate

  const workerRef = db.collection('workers').doc(workerId);
  const userRef = db.collection('users').doc(workerId);

  if (rating < 2.5) {
    // Severe performance penalty -> suspend worker for 7 days
    const suspendedUntil = new Date(Date.now() + 7 * 86400000).toISOString();
    await workerRef.update({
      status: 'suspended',
      isOnline: false,
      banReason: `রেটিং আশঙ্কাজনকভাবে কমে গেছে (${rating}/5.0)`,
      suspendedUntil
    });
    await userRef.update({
      status: 'suspended',
      banReason: `রেটিং আশঙ্কাজনকভাবে কমে গেছে (${rating}/5.0)`,
      suspendedUntil
    });
  } else if (rating < 3.5) {
    // Warning
    await db.collection('notifications').add({
      userId: workerId,
      title: 'রেটিং সতর্কতা! ⚠️',
      body: `আপনার গড় রেটিং বর্তমানে ${rating} এ নেমেছে। গ্রাহক সন্তুষ্টি নিশ্চিত করতে মনোযোগ দিন।`,
      type: 'safety',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }
}

/**
 * 72. banUser / unbanUser: Custom claims, blacklist, and audit logging
 */
export const banUser = functions.https.onCall(async (data, context) => {
  const actorUid = requireAdmin(context);
  const { uid, reason, durationDays } = data;
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Missing uid');

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  const userData = userDoc.data()!;

  const isPermanent = !durationDays;
  const suspendedUntil = isPermanent ? null : new Date(Date.now() + durationDays * 86400000).toISOString();
  const newStatus = isPermanent ? 'banned' : 'suspended';

  // 1. Update Firestore user
  await db.collection('users').doc(uid).update({
    status: newStatus,
    banReason: reason || 'কর্তৃপক্ষের সিদ্ধান্ত',
    suspendedUntil
  });

  // 2. Preserve existing custom claims while setting banned flag
  try {
    const authUser = await admin.auth().getUser(uid);
    await admin.auth().setCustomUserClaims(uid, {
      ...(authUser.customClaims || {}),
      banned: true
    });
  } catch (e) {
    console.warn(`Failed to set custom claim on ${uid}:`, e);
  }

  // 3. Add phone to blacklist
  if (userData.phone) {
    await db.collection('blacklist').doc(`blk_${userData.phone}`).set({
      type: 'phone',
      value: userData.phone,
      reason: reason || 'অ্যাকাউন্ট বরখাস্ত',
      bannedBy: actorUid,
      bannedAt: new Date().toISOString()
    });
  }

  // 4. Record audit log
  await db.collection('auditLogs').add({
    action: 'BAN_USER',
    actorId: actorUid,
    targetId: uid,
    targetType: 'user',
    reason,
    createdAt: new Date().toISOString()
  });

  return { success: true, status: newStatus };
});

export const unbanUser = functions.https.onCall(async (data, context) => {
  const actorUid = requireAdmin(context);
  const { uid } = data;
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Missing uid');

  await db.collection('users').doc(uid).update({
    status: 'active',
    banReason: admin.firestore.FieldValue.delete(),
    suspendedUntil: admin.firestore.FieldValue.delete()
  });

  try {
    const authUser = await admin.auth().getUser(uid);
    await admin.auth().setCustomUserClaims(uid, {
      ...(authUser.customClaims || {}),
      banned: false
    });
  } catch (e) {}

  await db.collection('auditLogs').add({
    action: 'UNBAN_USER',
    actorId: actorUid,
    targetId: uid,
    targetType: 'user',
    reason: 'ব্যান প্রত্যাহার করা হয়েছে',
    createdAt: new Date().toISOString()
  });

  return { success: true };
});

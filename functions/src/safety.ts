import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { requireSelfOrAdmin, requireAdmin } from './auth-helpers';

const db = admin.firestore();

/**
 * 78. triggerSOS: Emergency alert dispatch
 */
export const triggerSOS = functions.https.onCall(async (data, context) => {
  const { uid, userName, userPhone, location, emergencyContactPhone } = data;

  if (!uid || !location) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing SOS parameters');
  }

  requireSelfOrAdmin(context, uid);

  const sosRef = db.collection('sosAlerts').doc(`sos_${Date.now()}`);
  const sosData = {
    uid,
    userName: userName || 'ব্যবহারকারী',
    userPhone: userPhone || '',
    emergencyContactPhone: emergencyContactPhone || '',
    location,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  await sosRef.set(sosData);

  // Send push notification to Admin command center
  await db.collection('notifications').add({
    userId: 'admin',
    title: 'জরুরি SOS অ্যালার্ম! 🚨',
    body: `${userName} জরুরি সহায়তা চেয়েছেন! অবস্থান: ${location.address || 'সাভার'}`,
    type: 'safety',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Simulated SMS gateway trigger:
  console.log(`[SMS-GATEWAY] SOS SMS sent to emergency contact: ${emergencyContactPhone}`);

  return { success: true, sosId: sosRef.id };
});

/**
 * 92. approveWorker / rejectWorker
 */
export const approveWorker = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const { workerId, approved, rejectionReason } = data;
  if (!workerId) {
    throw new functions.https.HttpsError('invalid-argument', 'workerId is required');
  }

  const workerRef = db.collection('workers').doc(workerId);
  const userRef = db.collection('users').doc(workerId);

  if (approved) {
    await workerRef.update({
      verificationStatus: 'approved',
      verified: true,
      approvedAt: new Date().toISOString()
    });
    await userRef.update({ status: 'active' });

    await db.collection('notifications').add({
      userId: workerId,
      title: 'কেওয়াইসি ভেরিফিকেশন সফল! 🎉',
      body: 'অভিনন্দন! আপনার কাজখোঁজ কর্মী অ্যাকাউন্ট সক্রিয় করা হয়েছে। এখন আপনি কাজ শুরু করতে পারেন।',
      type: 'admin',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else {
    await workerRef.update({
      verificationStatus: 'rejected',
      verified: false,
      rejectionReason: rejectionReason || 'তথ্য বা এনআইডি অসম্পূর্ণ'
    });

    await db.collection('notifications').add({
      userId: workerId,
      title: 'কেওয়াইসি আবেদন বাতিল ⚠️',
      body: `আপনার আবেদনটি অনুমোদিত হয়নি। কারণ: ${rejectionReason || 'তথ্য অসম্পূর্ণ'}`,
      type: 'admin',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  return { success: true };
});

export const rejectWorker = functions.https.onCall(async (data, context) => {
  requireAdmin(context);
  const { workerId, rejectionReason } = data;
  if (!workerId) {
    throw new functions.https.HttpsError('invalid-argument', 'workerId is required');
  }

  const workerRef = db.collection('workers').doc(workerId);

  await workerRef.update({
    verificationStatus: 'rejected',
    verified: false,
    rejectionReason: rejectionReason || 'তথ্য বা এনআইডি অসম্পূর্ণ'
  });

  await db.collection('notifications').add({
    userId: workerId,
    title: 'কেওয়াইসি আবেদন বাতিল ⚠️',
    body: `আপনার আবেদনটি অনুমোদিত হয়নি। কারণ: ${rejectionReason || 'তথ্য অসম্পূর্ণ'}`,
    type: 'admin',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  return { success: true };
});

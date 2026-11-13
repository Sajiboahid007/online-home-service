import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * 66. paymentWebhook: Secure payment callback from SSLCommerz / bKash
 */
export const paymentWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { tran_id, val_id, amount, status, opt_a: jobId, opt_b: workerId } = req.body;

  if (status !== 'VALID' && status !== 'VALIDATED') {
    console.warn(`Payment failed for tran_id: ${tran_id}`);
    res.status(200).json({ status: 'FAILED' });
    return;
  }

  try {
    const paymentRecordRef = db.collection('payments').doc(tran_id || `pay_${Date.now()}`);
    await paymentRecordRef.set({
      transactionId: tran_id,
      validationId: val_id,
      amount: Number(amount),
      jobId: jobId || null,
      workerId: workerId || null,
      status: 'success',
      receivedAt: new Date().toISOString()
    });

    if (jobId) {
      // Mark job payment as completed
      await db.collection('jobs').doc(jobId).update({
        paymentStatus: 'paid',
        paymentMethod: 'digital',
        paidAt: new Date().toISOString()
      });
    }

    res.status(200).json({ status: 'SUCCESS' });
  } catch (error) {
    console.error('Error handling payment webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * 67. requestWithdraw: Worker initiates payout request
 */
export const requestWithdraw = functions.https.onCall(async (data, context) => {
  const { workerId, amount, method, accountNumber } = data;

  if (!workerId || !amount || amount < 100 || !accountNumber) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal parameters. Minimum ৳100.');
  }

  const workerRef = db.collection('workers').doc(workerId);

  return db.runTransaction(async (transaction) => {
    const workerDoc = await transaction.get(workerRef);
    if (!workerDoc.exists) throw new functions.https.HttpsError('not-found', 'Worker not found');
    const worker = workerDoc.data()!;

    const currentBalance = worker.wallet?.balance || 0;
    if (currentBalance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'পর্যাপ্ত ব্যালেন্স নেই।');
    }

    // Deduct balance from worker wallet immediately into escrow
    transaction.update(workerRef, {
      'wallet.balance': admin.firestore.FieldValue.increment(-amount)
    });

    // Create withdrawal request in queue
    const withdrawRef = db.collection('withdrawals').doc(`wd_${Date.now()}`);
    transaction.set(withdrawRef, {
      workerId,
      workerName: worker.name || 'কর্মী',
      amount,
      method: method || 'bkash',
      accountNumber,
      status: 'pending',
      requestedAt: new Date().toISOString()
    });

    return { success: true, message: 'উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে।' };
  });
});

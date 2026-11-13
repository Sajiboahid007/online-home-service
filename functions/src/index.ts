import * as admin from 'firebase-admin';

// Initialize Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export dispatch and job lifecycle functions
export {
  onJobCreated,
  acceptJob,
  grabBoardJob,
  submitBid,
  chooseBid,
  updateJobStatus,
  completeJob,
  cancelJob
} from './dispatch';

// Export review, rating and ban functions
export {
  submitReview,
  banUser,
  unbanUser
} from './reviews';

// Export payment and withdrawal functions
export {
  paymentWebhook,
  requestWithdraw
} from './payments';

// Export safety and admin verification functions
export {
  triggerSOS,
  approveWorker,
  rejectWorker
} from './safety';

// Export scheduled background cron jobs
export {
  autoOfflineStaleWorkers,
  liftExpiredSuspensions,
  dailyReport
} from './schedulers';

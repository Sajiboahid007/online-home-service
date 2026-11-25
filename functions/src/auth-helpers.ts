import * as functions from 'firebase-functions/v1';

export function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }
  return context.auth.uid;
}

export function isAdminUser(context: functions.https.CallableContext): boolean {
  const role = context.auth?.token?.role;
  return role === 'admin' || role === 'superadmin';
}

export function requireAdmin(context: functions.https.CallableContext): string {
  const uid = requireAuth(context);
  if (!isAdminUser(context)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin privileges are required.');
  }
  return uid;
}

export function requireSelfOrAdmin(context: functions.https.CallableContext, targetUid: string): string {
  const uid = requireAuth(context);
  if (uid !== targetUid && !isAdminUser(context)) {
    throw new functions.https.HttpsError('permission-denied', 'You are not authorized to act for this user.');
  }
  return uid;
}

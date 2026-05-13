import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const FREE_LIMIT = 15;

export const getQuota = functions.onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new functions.HttpsError('unauthenticated', 'Sign in required');

  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) throw new functions.HttpsError('not-found', 'User not found');

  const data = snap.data()!;
  const now = admin.firestore.Timestamp.now();
  let { sessionCount, sessionResetDate, subscriptionTier } = data;

  if (sessionResetDate && now.toMillis() > sessionResetDate.toMillis()) {
    sessionCount = 0;
    const newReset = new Date(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
    await userRef.update({ sessionCount: 0, sessionResetDate: admin.firestore.Timestamp.fromDate(newReset) });
  }

  const limit = subscriptionTier === 'pro' ? Infinity : FREE_LIMIT;
  return {
    sessionCount,
    limit: subscriptionTier === 'pro' ? null : FREE_LIMIT,
    remaining: subscriptionTier === 'pro' ? null : Math.max(0, FREE_LIMIT - sessionCount),
    exceeded: subscriptionTier !== 'pro' && sessionCount >= limit,
    subscriptionTier,
  };
});

export async function incrementSessionCount(uid: string): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  await userRef.update({ sessionCount: admin.firestore.FieldValue.increment(1) });
}

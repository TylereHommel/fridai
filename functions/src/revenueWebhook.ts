import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const revenueWebhook = functions.onRequest(async (req, res) => {
  if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

  const event = req.body as { event?: { type?: string; app_user_id?: string } };
  const type: string = event.event?.type ?? '';
  const appUserId: string = event.event?.app_user_id ?? '';

  if (!appUserId) { res.status(400).send('Missing app_user_id'); return; }

  const userRef = db.collection('users').doc(appUserId);
  const now = admin.firestore.Timestamp.now();
  const resetIn30 = admin.firestore.Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      await userRef.update({
        subscriptionTier: 'pro',
        sessionCount: 0,
        sessionResetDate: resetIn30,
      });
      break;
    case 'CANCELLATION':
      await userRef.update({ subscriptionTier: 'free' });
      break;
    case 'EXPIRATION':
      await userRef.update({ subscriptionTier: 'free' });
      break;
  }

  res.status(200).send('OK');
});

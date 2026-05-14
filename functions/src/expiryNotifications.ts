import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const db = admin.firestore();

export const dailyExpiryNotifications = onSchedule('0 8 * * *', async () => {
  const now = admin.firestore.Timestamp.now();
  const twoDaysLater = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + 2 * 24 * 60 * 60 * 1000
  );

  const snap = await db
    .collectionGroup('pantry')
    .where('expiryDate', '>=', now)
    .where('expiryDate', '<=', twoDaysLater)
    .get();

  const byUid = new Map<string, string[]>();
  for (const docSnap of snap.docs) {
    // doc path: users/{uid}/pantry/{itemId}
    const uid = docSnap.ref.path.split('/')[1];
    const name = docSnap.data().name as string;
    if (!byUid.has(uid)) byUid.set(uid, []);
    byUid.get(uid)!.push(name);
  }

  const sends: Promise<void>[] = [];
  for (const [uid, itemNames] of byUid) {
    sends.push(notifyUser(uid, itemNames));
  }
  await Promise.allSettled(sends);
});

async function notifyUser(uid: string, itemNames: string[]): Promise<void> {
  const userSnap = await db.doc(`users/${uid}`).get();
  const expoPushToken = userSnap.data()?.expoPushToken as string | undefined;
  if (!expoPushToken) return;

  const body =
    itemNames.length === 1
      ? `${itemNames[0]} expires within 2 days — use it up!`
      : `${itemNames.length} pantry items expire within 2 days.`;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      to: expoPushToken,
      title: '🛒 Pantry expiry reminder',
      body,
      data: { type: 'expiry_reminder' },
      sound: 'default',
    }),
  });
}

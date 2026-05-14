"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyExpiryNotifications = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const db = admin.firestore();
const messaging = admin.messaging();
exports.dailyExpiryNotifications = (0, scheduler_1.onSchedule)('0 8 * * *', async () => {
    const now = admin.firestore.Timestamp.now();
    const twoDaysLater = admin.firestore.Timestamp.fromMillis(now.toMillis() + 2 * 24 * 60 * 60 * 1000);
    const snap = await db
        .collectionGroup('pantry')
        .where('expiryDate', '>=', now)
        .where('expiryDate', '<=', twoDaysLater)
        .get();
    const byUid = new Map();
    for (const docSnap of snap.docs) {
        // doc path: users/{uid}/pantry/{itemId}
        const uid = docSnap.ref.path.split('/')[1];
        const name = docSnap.data().name;
        if (!byUid.has(uid))
            byUid.set(uid, []);
        byUid.get(uid).push(name);
    }
    const sends = [];
    for (const [uid, itemNames] of byUid) {
        sends.push(notifyUser(uid, itemNames));
    }
    await Promise.allSettled(sends);
});
async function notifyUser(uid, itemNames) {
    const userSnap = await db.doc(`users/${uid}`).get();
    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken)
        return;
    const body = itemNames.length === 1
        ? `${itemNames[0]} expires within 2 days — use it up!`
        : `${itemNames.length} pantry items expire within 2 days.`;
    await messaging.send({
        token: fcmToken,
        notification: { title: '🛒 Pantry expiry reminder', body },
        data: { type: 'expiry_reminder' },
    });
}
//# sourceMappingURL=expiryNotifications.js.map
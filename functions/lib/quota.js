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
exports.getQuota = void 0;
exports.incrementSessionCount = incrementSessionCount;
const functions = __importStar(require("firebase-functions/v2/https"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0)
    admin.initializeApp();
const db = admin.firestore();
const FREE_LIMIT = 15;
exports.getQuota = functions.onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new functions.HttpsError('unauthenticated', 'Sign in required');
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists)
        throw new functions.HttpsError('not-found', 'User not found');
    const data = snap.data();
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
async function incrementSessionCount(uid) {
    const userRef = db.collection('users').doc(uid);
    await userRef.update({ sessionCount: admin.firestore.FieldValue.increment(1) });
}
//# sourceMappingURL=quota.js.map
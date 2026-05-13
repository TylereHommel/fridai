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
exports.revenueWebhook = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.revenueWebhook = functions.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const event = req.body;
    const type = event.event?.type ?? '';
    const appUserId = event.event?.app_user_id ?? '';
    if (!appUserId) {
        res.status(400).send('Missing app_user_id');
        return;
    }
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
//# sourceMappingURL=revenueWebhook.js.map
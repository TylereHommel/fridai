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
exports.generateRecipeImage = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const storage = admin.storage();
exports.generateRecipeImage = functions.onCall({ secrets: ['REPLICATE_API_KEY'], timeoutSeconds: 120 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new functions.HttpsError('unauthenticated', 'Sign in required');
    const { recipeId, title } = request.data;
    const archiveRef = db.collection('recipeArchive').doc(recipeId);
    const snap = await archiveRef.get();
    if (snap.exists && snap.data()?.imageStatus === 'ready') {
        return { imageUrl: snap.data().imageUrl };
    }
    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    const prompt = `${title}, professional food photography, natural lighting, shallow depth of field, rustic wooden table, appetizing plating, ultra-realistic, 4k`;
    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait',
        },
        body: JSON.stringify({ input: { prompt, num_outputs: 1, output_format: 'webp' } }),
    });
    if (!response.ok) {
        await archiveRef.update({ imageStatus: 'failed' });
        throw new functions.HttpsError('internal', 'Image generation failed');
    }
    const result = await response.json();
    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    const imageResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const bucket = storage.bucket();
    const file = bucket.file(`recipeImages/${recipeId}.webp`);
    await file.save(buffer, { metadata: { contentType: 'image/webp' }, public: true });
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/recipeImages/${recipeId}.webp`;
    await archiveRef.update({ imageUrl: publicUrl, imageStatus: 'ready' });
    return { imageUrl: publicUrl };
});
//# sourceMappingURL=generateRecipeImage.js.map
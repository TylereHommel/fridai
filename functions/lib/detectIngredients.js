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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectIngredients = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
exports.detectIngredients = functions.onCall({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 60 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new functions.HttpsError('unauthenticated', 'Sign in required');
    const { imageUrls, dietaryRestrictions } = request.data;
    if (!imageUrls?.length)
        throw new functions.HttpsError('invalid-argument', 'No images provided');
    const imageContent = imageUrls.map((url) => ({
        type: 'image',
        source: { type: 'url', url },
    }));
    const restrictionNote = dietaryRestrictions.length > 0
        ? `User dietary restrictions: ${dietaryRestrictions.join(', ')}. Note any items that conflict.`
        : '';
    const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: [
                    ...imageContent,
                    {
                        type: 'text',
                        text: `Look at these fridge/pantry photos and list every food ingredient you can identify. ${restrictionNote}
Return ONLY a JSON array of ingredient names, lowercase, singular form, no brands. Example: ["eggs", "milk", "spinach", "chicken breast", "garlic"]. Return nothing else.`,
                    },
                ],
            },
        ],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    let ingredients = [];
    try {
        const match = text.match(/\[[\s\S]*\]/);
        ingredients = match ? JSON.parse(match[0]) : [];
    }
    catch {
        ingredients = [];
    }
    return { ingredients, sessionId: `${uid}_${Date.now()}` };
});
//# sourceMappingURL=detectIngredients.js.map
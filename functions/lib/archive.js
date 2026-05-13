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
exports.normalizeIngredientKeys = normalizeIngredientKeys;
exports.lookupArchive = lookupArchive;
exports.writeArchive = writeArchive;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
function normalizeIngredientKeys(ingredients) {
    return ingredients
        .map((i) => i.toLowerCase().trim())
        .filter((i) => i.length > 0)
        .sort();
}
async function lookupArchive(ingredientKeys, dietaryRestrictions) {
    const normalized = normalizeIngredientKeys(ingredientKeys);
    const query = db.collection('recipeArchive')
        .where('ingredientKeys', 'array-contains-any', normalized.slice(0, 10))
        .orderBy('averageRating', 'desc')
        .limit(20);
    const snap = await query.get();
    const now = admin.firestore.Timestamp.now();
    const results = [];
    for (const docSnap of snap.docs) {
        const recipe = { id: docSnap.id, ...docSnap.data() };
        const recipeKeys = recipe.ingredientKeys;
        const userHasAll = recipeKeys.every((k) => normalized.includes(k));
        const meetsRestrictions = dietaryRestrictions.length === 0 ||
            dietaryRestrictions.every((r) => recipe.dietaryTags.includes(r));
        if (userHasAll && meetsRestrictions) {
            results.push(recipe);
            await docSnap.ref.update({
                usageCount: admin.firestore.FieldValue.increment(1),
                lastServedAt: now,
            });
        }
        if (results.length >= 3)
            break;
    }
    return results;
}
async function writeArchive(recipe) {
    const existing = await db.collection('recipeArchive')
        .where('title', '==', recipe.title)
        .limit(1)
        .get();
    if (!existing.empty) {
        return existing.docs[0].id;
    }
    const now = admin.firestore.Timestamp.now();
    const ref = await db.collection('recipeArchive').add({
        ...recipe,
        usageCount: 1,
        averageRating: null,
        ratingCount: 0,
        imageUrl: null,
        imageStatus: 'pending',
        createdAt: now,
        lastServedAt: now,
    });
    return ref.id;
}
//# sourceMappingURL=archive.js.map
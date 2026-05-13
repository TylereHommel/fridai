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
exports.generateRecipes = void 0;
const functions = __importStar(require("firebase-functions/v2/https"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const archive_1 = require("./archive");
const quota_1 = require("./quota");
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
exports.generateRecipes = functions.onCall({ secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 }, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new functions.HttpsError('unauthenticated', 'Sign in required');
    const { ingredients, dietaryRestrictions, cuisinePreferences } = request.data;
    if (!ingredients?.length)
        throw new functions.HttpsError('invalid-argument', 'No ingredients');
    const ingredientKeys = (0, archive_1.normalizeIngredientKeys)(ingredients);
    const archiveResults = await (0, archive_1.lookupArchive)(ingredientKeys, dietaryRestrictions);
    const needed = Math.max(0, 4 - archiveResults.length);
    const claudeRecipes = [];
    if (needed > 0) {
        const restrictionPrompt = dietaryRestrictions.length > 0
            ? `Dietary restrictions (MUST respect): ${dietaryRestrictions.join(', ')}.`
            : '';
        const cuisinePrompt = cuisinePreferences.length > 0
            ? `Preferred cuisines: ${cuisinePreferences.join(', ')}.`
            : '';
        const prompt = `You are a professional chef. Given these ingredients: ${ingredients.join(', ')}.
${restrictionPrompt} ${cuisinePrompt}

Generate ${needed} distinct recipes. Return ONLY valid JSON array. Each recipe:
{
  "title": string,
  "ingredients": [{"name": string, "amount": string}],
  "steps": [{"instruction": string, "tip": string | null}],
  "macros": {"calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number},
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number,
  "dietaryTags": string[],
  "substitutionNote": string | null
}

Rules:
- Each step may include ONE practical tip (technique, common mistake, or general best practice like "rest meat before slicing" or "taste as you go")
- Macros are per serving estimates
- ingredientAmount uses real measurements like "2 cups" or "3 cloves"
- Only use provided ingredients plus basic pantry staples (oil, salt, pepper, water)`;
        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rawRecipes = [];
        try {
            const match = text.match(/\[[\s\S]*\]/);
            rawRecipes = match ? JSON.parse(match[0]) : [];
        }
        catch {
            rawRecipes = [];
        }
        for (const raw of rawRecipes) {
            const recipeIngredientKeys = (0, archive_1.normalizeIngredientKeys)(raw.ingredients.map((i) => i.name));
            const archiveId = await (0, archive_1.writeArchive)({
                title: raw.title,
                ingredients: raw.ingredients,
                ingredientKeys: recipeIngredientKeys,
                steps: raw.steps,
                macros: raw.macros,
                prepTime: raw.prepTime,
                cookTime: raw.cookTime,
                servings: raw.servings,
                dietaryTags: raw.dietaryTags ?? [],
                substitutionNote: raw.substitutionNote ?? null,
            });
            const matchScore = recipeIngredientKeys.filter((k) => ingredientKeys.includes(k)).length / recipeIngredientKeys.length;
            claudeRecipes.push({
                id: archiveId,
                title: raw.title,
                ingredients: raw.ingredients.map((i) => ({
                    name: i.name,
                    amount: i.amount,
                    inPantry: ingredientKeys.includes(i.name.toLowerCase()),
                })),
                steps: raw.steps,
                macros: raw.macros,
                prepTime: raw.prepTime,
                cookTime: raw.cookTime,
                servings: raw.servings,
                dietaryTags: raw.dietaryTags ?? [],
                substitutionNote: raw.substitutionNote ?? null,
                imageUrl: null,
                imageStatus: 'pending',
                matchScore,
                source: 'generated',
            });
        }
    }
    const archiveMapped = archiveResults.map((r) => ({
        id: r.id,
        title: r.title,
        ingredients: r.ingredients.map((i) => ({
            name: i.name,
            amount: i.amount,
            inPantry: ingredientKeys.includes(i.name.toLowerCase()),
        })),
        steps: r.steps,
        macros: r.macros,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        dietaryTags: r.dietaryTags,
        substitutionNote: r.substitutionNote,
        imageUrl: r.imageUrl,
        imageStatus: r.imageStatus,
        matchScore: r.ingredientKeys.filter((k) => ingredientKeys.includes(k)).length / r.ingredientKeys.length,
        source: 'archive',
    }));
    await (0, quota_1.incrementSessionCount)(uid);
    return [...archiveMapped, ...claudeRecipes].sort((a, b) => b.matchScore - a.matchScore);
});
//# sourceMappingURL=generateRecipes.js.map
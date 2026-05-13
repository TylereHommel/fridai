import * as functions from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';
import { lookupArchive, writeArchive, normalizeIngredientKeys, ArchiveRecipe } from './archive';
import { incrementSessionCount } from './quota';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type GenerateRequest = {
  ingredients: string[];
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
};

export type RecipeResult = {
  id: string;
  title: string;
  ingredients: { name: string; amount: string; inPantry: boolean }[];
  steps: { instruction: string; tip: string | null }[];
  macros: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string[];
  substitutionNote: string | null;
  imageUrl: string | null;
  imageStatus: 'pending' | 'ready' | 'failed';
  matchScore: number;
  source: 'archive' | 'generated';
};

export const generateRecipes = functions.onCall<GenerateRequest>(
  { secrets: ['ANTHROPIC_API_KEY'], timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new functions.HttpsError('unauthenticated', 'Sign in required');

    const { ingredients, dietaryRestrictions, cuisinePreferences } = request.data;
    if (!ingredients?.length) throw new functions.HttpsError('invalid-argument', 'No ingredients');

    const ingredientKeys = normalizeIngredientKeys(ingredients);

    const archiveResults = await lookupArchive(ingredientKeys, dietaryRestrictions);
    const needed = Math.max(0, 4 - archiveResults.length);
    const claudeRecipes: RecipeResult[] = [];

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
      let rawRecipes: any[] = [];
      try {
        const match = text.match(/\[[\s\S]*\]/);
        rawRecipes = match ? JSON.parse(match[0]) : [];
      } catch { rawRecipes = []; }

      for (const raw of rawRecipes) {
        const recipeIngredientKeys = normalizeIngredientKeys(raw.ingredients.map((i: { name: string }) => i.name));
        const archiveId = await writeArchive({
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
          ingredients: raw.ingredients.map((i: { name: string; amount: string }) => ({
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

    const archiveMapped: RecipeResult[] = archiveResults.map((r: ArchiveRecipe) => ({
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
      source: 'archive' as const,
    }));

    await incrementSessionCount(uid);

    return [...archiveMapped, ...claudeRecipes].sort((a, b) => b.matchScore - a.matchScore);
  }
);

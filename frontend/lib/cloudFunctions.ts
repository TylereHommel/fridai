import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';

const fns = getFunctions(app);

type QuotaResult = {
  sessionCount: number;
  limit: number | null;
  remaining: number | null;
  exceeded: boolean;
  subscriptionTier: 'free' | 'pro';
};

type DetectResult = { ingredients: string[]; sessionId: string };

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

export async function getQuota(): Promise<QuotaResult> {
  const fn = httpsCallable<void, QuotaResult>(fns, 'getQuota');
  const result = await fn();
  return result.data;
}

export async function detectIngredients(
  imageUrls: string[],
  dietaryRestrictions: string[]
): Promise<DetectResult> {
  const fn = httpsCallable<{ imageUrls: string[]; dietaryRestrictions: string[] }, DetectResult>(
    fns, 'detectIngredients'
  );
  const result = await fn({ imageUrls, dietaryRestrictions });
  return result.data;
}

export async function generateRecipes(
  ingredients: string[],
  dietaryRestrictions: string[],
  cuisinePreferences: string[]
): Promise<RecipeResult[]> {
  const fn = httpsCallable<
    { ingredients: string[]; dietaryRestrictions: string[]; cuisinePreferences: string[] },
    RecipeResult[]
  >(fns, 'generateRecipes');
  const result = await fn({ ingredients, dietaryRestrictions, cuisinePreferences });
  return result.data;
}

export async function generateRecipeImage(recipeId: string, title: string): Promise<string> {
  const fn = httpsCallable<{ recipeId: string; title: string }, { imageUrl: string }>(
    fns, 'generateRecipeImage'
  );
  const result = await fn({ recipeId, title });
  return result.data.imageUrl;
}

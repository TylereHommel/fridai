import * as admin from 'firebase-admin';

const db = admin.firestore();

export type ArchiveRecipe = {
  id: string;
  title: string;
  ingredients: { name: string; amount: string }[];
  ingredientKeys: string[];
  steps: { instruction: string; tip: string | null }[];
  macros: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string[];
  substitutionNote: string | null;
  usageCount: number;
  averageRating: number | null;
  ratingCount: number;
  imageUrl: string | null;
  imageStatus: 'pending' | 'ready' | 'failed';
  createdAt: admin.firestore.Timestamp;
  lastServedAt: admin.firestore.Timestamp;
};

export function normalizeIngredientKeys(ingredients: string[]): string[] {
  return ingredients
    .map((i) => i.toLowerCase().trim())
    .filter((i) => i.length > 0)
    .sort();
}

export async function lookupArchive(
  ingredientKeys: string[],
  dietaryRestrictions: string[]
): Promise<ArchiveRecipe[]> {
  const normalized = normalizeIngredientKeys(ingredientKeys);

  const query = db.collection('recipeArchive')
    .where('ingredientKeys', 'array-contains-any', normalized.slice(0, 10))
    .orderBy('averageRating', 'desc')
    .limit(20);

  const snap = await query.get();
  const now = admin.firestore.Timestamp.now();
  const results: ArchiveRecipe[] = [];

  for (const docSnap of snap.docs) {
    const recipe = { id: docSnap.id, ...docSnap.data() } as ArchiveRecipe;
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
    if (results.length >= 3) break;
  }

  return results;
}

export async function writeArchive(recipe: Omit<ArchiveRecipe, 'id' | 'usageCount' | 'averageRating' | 'ratingCount' | 'imageUrl' | 'imageStatus' | 'createdAt' | 'lastServedAt'>): Promise<string> {
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

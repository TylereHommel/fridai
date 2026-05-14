import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type TrendingRecipe = {
  id: string;
  title: string;
  imageUrl: string | null;
  imageStatus: 'pending' | 'ready' | 'failed';
  macros: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  prepTime: number;
  cookTime: number;
  servings: number;
  dietaryTags: string[];
  usageCount: number;
  averageRating: number | null;
};

export async function fetchTrending(dietaryRestrictions: string[] = []): Promise<TrendingRecipe[]> {
  const q = query(collection(db, 'recipeArchive'), orderBy('usageCount', 'desc'), limit(30));
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrendingRecipe));

  const filtered = dietaryRestrictions.length === 0
    ? all
    : all.filter((r) => dietaryRestrictions.every((dr) => r.dietaryTags.includes(dr)));

  return filtered.slice(0, 10);
}

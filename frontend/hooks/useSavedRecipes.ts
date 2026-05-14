import { useState, useEffect } from 'react';
import { SavedRecipe, subscribeToSavedRecipes, deleteSavedRecipe, rateRecipe } from '../lib/savedRecipes';
import { useAuth } from './useAuth';

export function useSavedRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSavedRecipes(user.uid, (r) => {
      setRecipes(r);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  async function remove(recipeId: string) {
    if (!user) return;
    await deleteSavedRecipe(user.uid, recipeId);
  }

  async function rate(recipeId: string, rating: number) {
    if (!user) return;
    await rateRecipe(user.uid, recipeId, rating);
  }

  return { recipes, loading, remove, rate };
}

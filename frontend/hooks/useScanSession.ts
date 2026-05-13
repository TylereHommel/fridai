import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { uploadPhotos } from '../lib/upload';
import { detectIngredients, generateRecipes, RecipeResult } from '../lib/cloudFunctions';
import { getUserDoc } from '../lib/firestore';

export type ScanPhase =
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'detecting'
  | 'reviewing'
  | 'generating'
  | 'results'
  | 'error';

export type ScanSession = {
  phase: ScanPhase;
  photoUris: string[];
  uploadedUrls: string[];
  detectedIngredients: string[];
  confirmedIngredients: string[];
  recipes: RecipeResult[];
  error: string | null;
  addPhoto: (uri: string) => void;
  removePhoto: (uri: string) => void;
  submitPhotos: () => Promise<void>;
  toggleIngredient: (name: string) => void;
  addIngredient: (name: string) => void;
  generateFromIngredients: () => Promise<void>;
  reset: () => void;
};

export function useScanSession(): ScanSession {
  const { user } = useAuth();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [confirmedIngredients, setConfirmedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addPhoto = useCallback((uri: string) => {
    setPhotoUris((prev) => [...prev, uri]);
    setPhase('capturing');
  }, []);

  const removePhoto = useCallback((uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  }, []);

  const submitPhotos = useCallback(async () => {
    if (!user || photoUris.length === 0) return;
    try {
      setPhase('uploading');
      const urls = await uploadPhotos(photoUris, user.uid);
      setUploadedUrls(urls);

      setPhase('detecting');
      const userDoc = await getUserDoc(user.uid);
      const { ingredients } = await detectIngredients(
        urls,
        userDoc?.dietaryRestrictions ?? []
      );
      setDetectedIngredients(ingredients);
      setConfirmedIngredients(ingredients);
      setPhase('reviewing');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('error');
    }
  }, [user, photoUris]);

  const toggleIngredient = useCallback((name: string) => {
    setConfirmedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  }, []);

  const addIngredient = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !confirmedIngredients.includes(trimmed)) {
      setConfirmedIngredients((prev) => [...prev, trimmed]);
    }
  }, [confirmedIngredients]);

  const generateFromIngredients = useCallback(async () => {
    if (!user || confirmedIngredients.length === 0) return;
    try {
      setPhase('generating');
      const userDoc = await getUserDoc(user.uid);
      const results = await generateRecipes(
        confirmedIngredients,
        userDoc?.dietaryRestrictions ?? [],
        userDoc?.cuisinePreferences ?? []
      );
      setRecipes(results);
      setPhase('results');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Recipe generation failed');
      setPhase('error');
    }
  }, [user, confirmedIngredients]);

  const reset = useCallback(() => {
    setPhase('idle');
    setPhotoUris([]);
    setUploadedUrls([]);
    setDetectedIngredients([]);
    setConfirmedIngredients([]);
    setRecipes([]);
    setError(null);
  }, []);

  return {
    phase,
    photoUris,
    uploadedUrls,
    detectedIngredients,
    confirmedIngredients,
    recipes,
    error,
    addPhoto,
    removePhoto,
    submitPhotos,
    toggleIngredient,
    addIngredient,
    generateFromIngredients,
    reset,
  };
}

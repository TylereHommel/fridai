import { renderHook, act } from '@testing-library/react-native';
import { useScanSession } from '../hooks/useScanSession';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'uid123' } }),
}));

jest.mock('../lib/upload', () => ({
  uploadPhotos: jest.fn().mockResolvedValue(['https://storage.example.com/1.jpg']),
}));

jest.mock('../lib/cloudFunctions', () => ({
  detectIngredients: jest.fn().mockResolvedValue({ ingredients: ['eggs', 'milk', 'spinach'], sessionId: 's1' }),
  generateRecipes: jest.fn().mockResolvedValue([
    {
      id: 'r1', title: 'Spinach Omelette', ingredients: [], steps: [],
      macros: { calories: 250, protein: 18, carbs: 4, fat: 18, fiber: 1 },
      prepTime: 5, cookTime: 10, servings: 1, dietaryTags: [], substitutionNote: null,
      imageUrl: null, imageStatus: 'pending', matchScore: 0.9, source: 'generated',
    },
  ]),
}));

jest.mock('../lib/firestore', () => ({
  getUserDoc: jest.fn().mockResolvedValue({ dietaryRestrictions: [], cuisinePreferences: [] }),
}));

describe('useScanSession', () => {
  it('starts in idle phase', () => {
    const { result } = renderHook(() => useScanSession());
    expect(result.current.phase).toBe('idle');
    expect(result.current.photoUris).toHaveLength(0);
  });

  it('addPhoto transitions to capturing', () => {
    const { result } = renderHook(() => useScanSession());
    act(() => { result.current.addPhoto('file:///photo1.jpg'); });
    expect(result.current.phase).toBe('capturing');
    expect(result.current.photoUris).toHaveLength(1);
  });

  it('removePhoto removes the photo', () => {
    const { result } = renderHook(() => useScanSession());
    act(() => { result.current.addPhoto('file:///photo1.jpg'); });
    act(() => { result.current.removePhoto('file:///photo1.jpg'); });
    expect(result.current.photoUris).toHaveLength(0);
  });

  it('submitPhotos goes through uploading→detecting→reviewing', async () => {
    const { result } = renderHook(() => useScanSession());
    act(() => { result.current.addPhoto('file:///photo1.jpg'); });
    await act(async () => { await result.current.submitPhotos(); });
    expect(result.current.phase).toBe('reviewing');
    expect(result.current.detectedIngredients).toEqual(['eggs', 'milk', 'spinach']);
  });

  it('generateFromIngredients reaches results phase', async () => {
    const { result } = renderHook(() => useScanSession());
    act(() => { result.current.addPhoto('file:///photo1.jpg'); });
    await act(async () => { await result.current.submitPhotos(); });
    await act(async () => { await result.current.generateFromIngredients(); });
    expect(result.current.phase).toBe('results');
    expect(result.current.recipes).toHaveLength(1);
  });

  it('reset returns to idle', () => {
    const { result } = renderHook(() => useScanSession());
    act(() => { result.current.addPhoto('file:///photo1.jpg'); });
    act(() => { result.current.reset(); });
    expect(result.current.phase).toBe('idle');
    expect(result.current.photoUris).toHaveLength(0);
  });
});

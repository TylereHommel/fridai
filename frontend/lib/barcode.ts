export type BarcodeProduct = {
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export async function lookupBarcode(code: string): Promise<BarcodeProduct | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    if (!res.ok) return null;
    const data = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        generic_name?: string;
        nutriments?: Record<string, number>;
      };
    };
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};
    const name = p.product_name || p.generic_name || '';
    if (!name) return null;

    return {
      name,
      calories: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null,
      protein: n['proteins_100g'] ?? null,
      carbs: n['carbohydrates_100g'] ?? null,
      fat: n['fat_100g'] ?? null,
    };
  } catch {
    return null;
  }
}

import { lookupBarcode } from '../lib/barcode';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => mockFetch.mockClear());

describe('lookupBarcode', () => {
  it('returns product data when found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Organic Spinach',
          nutriments: {
            'energy-kcal_100g': 23,
            proteins_100g: 2.9,
            carbohydrates_100g: 3.6,
            fat_100g: 0.4,
          },
        },
      }),
    });

    const result = await lookupBarcode('0123456789');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Organic Spinach');
    expect(result!.calories).toBe(23);
    expect(result!.protein).toBe(2.9);
  });

  it('returns null when product not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 0 }),
    });
    expect(await lookupBarcode('0000000000')).toBeNull();
  });

  it('returns null when product has no name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: { product_name: '', nutriments: {} },
      }),
    });
    expect(await lookupBarcode('0000000001')).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(await lookupBarcode('0000000002')).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    expect(await lookupBarcode('0000000003')).toBeNull();
  });
});

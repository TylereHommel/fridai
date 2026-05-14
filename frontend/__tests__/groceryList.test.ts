jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  query: jest.fn(),
  orderBy: jest.fn(),
  writeBatch: jest.fn(() => ({
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  Timestamp: { fromMillis: jest.fn(), now: jest.fn() },
}));

import { addGroceryItem, toggleGroceryItem, deleteGroceryItem } from '../lib/groceryList';
import { addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const mockAddDoc = addDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('groceryList', () => {
  it('addGroceryItem calls addDoc with correct fields', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'item1' });
    const id = await addGroceryItem('uid1', { name: 'Milk', quantity: '1L', checked: false, sourceRecipeId: null });
    expect(id).toBe('item1');
    expect(mockAddDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ name: 'Milk', quantity: '1L', checked: false })
    );
  });

  it('toggleGroceryItem calls updateDoc with checked value', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    await toggleGroceryItem('uid1', 'item1', true);
    expect(mockUpdateDoc).toHaveBeenCalledWith(undefined, { checked: true });
  });

  it('deleteGroceryItem calls deleteDoc', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined);
    await deleteGroceryItem('uid1', 'item1');
    expect(mockDeleteDoc).toHaveBeenCalled();
  });
});

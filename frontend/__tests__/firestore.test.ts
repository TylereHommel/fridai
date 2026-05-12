import { createUserDoc, getUserDoc, updateUserDoc } from '../lib/firestore';

jest.mock('../lib/firebase', () => ({ db: {} }));

const mockRef = 'mockDocRef';
const mockDoc = jest.fn(() => mockRef);
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createUserDoc', () => {
  it('creates a new document when none exists', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    mockSetDoc.mockResolvedValueOnce(undefined);

    await createUserDoc('uid1', { email: 'a@b.com', displayName: 'Alice' });

    expect(mockSetDoc).toHaveBeenCalledWith(mockRef, expect.objectContaining({
      email: 'a@b.com',
      displayName: 'Alice',
      sessionCount: 0,
      subscriptionTier: 'free',
      themeColor: 'forest',
      darkMode: false,
      dietaryRestrictions: [],
      cuisinePreferences: [],
    }));
  });

  it('does not overwrite an existing document', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true });

    await createUserDoc('uid1', { email: 'a@b.com', displayName: 'Alice' });

    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe('getUserDoc', () => {
  it('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    const result = await getUserDoc('uid1');
    expect(result).toBeNull();
  });

  it('returns document data when it exists', async () => {
    const data = { email: 'a@b.com', displayName: 'Alice', sessionCount: 3 };
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => data });
    const result = await getUserDoc('uid1');
    expect(result).toEqual(data);
  });
});

describe('updateUserDoc', () => {
  it('calls updateDoc with the provided partial data', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    await updateUserDoc('uid1', { darkMode: true, themeColor: 'ocean' });
    expect(mockUpdateDoc).toHaveBeenCalledWith(mockRef, { darkMode: true, themeColor: 'ocean' });
  });
});

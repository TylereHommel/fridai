jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

import { getWeekId, DAY_KEYS } from '../lib/planner';

describe('getWeekId', () => {
  it('returns the Monday of the current week in YYYY-MM-DD format', () => {
    const id = getWeekId(new Date('2026-05-13')); // Wednesday
    expect(id).toBe('2026-05-11');
  });

  it('returns same date when the input is already Monday', () => {
    const id = getWeekId(new Date('2026-05-11')); // Monday
    expect(id).toBe('2026-05-11');
  });

  it('handles Sunday correctly (rolls back to previous Monday)', () => {
    const id = getWeekId(new Date('2026-05-17')); // Sunday
    expect(id).toBe('2026-05-11');
  });
});

describe('DAY_KEYS', () => {
  it('has 7 days in order from monday to sunday', () => {
    expect(DAY_KEYS).toHaveLength(7);
    expect(DAY_KEYS[0]).toBe('monday');
    expect(DAY_KEYS[6]).toBe('sunday');
  });
});

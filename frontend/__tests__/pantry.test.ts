jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
  Timestamp: { fromDate: jest.fn(), now: jest.fn() },
  query: jest.fn(),
  orderBy: jest.fn(),
}));

import { getExpiryStatus } from '../lib/pantry';

function makeTimestamp(date: Date) {
  return { toDate: () => date, toMillis: () => date.getTime() } as any;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('getExpiryStatus', () => {
  it('returns "none" when no expiry date', () => {
    expect(getExpiryStatus({ expiryDate: null })).toBe('none');
  });

  it('returns "expired" for a past date', () => {
    expect(getExpiryStatus({ expiryDate: makeTimestamp(daysFromNow(-2)) })).toBe('expired');
  });

  it('returns "today" for expiry within the next 24 hours', () => {
    expect(getExpiryStatus({ expiryDate: makeTimestamp(daysFromNow(0.5)) })).toBe('today');
  });

  it('returns "soon" for expiry within 7 days', () => {
    expect(getExpiryStatus({ expiryDate: makeTimestamp(daysFromNow(4)) })).toBe('soon');
  });

  it('returns "ok" for expiry more than 7 days away', () => {
    expect(getExpiryStatus({ expiryDate: makeTimestamp(daysFromNow(14)) })).toBe('ok');
  });
});

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import {
  requestNotificationPermission,
  scheduleExpiryNotifications,
  cancelNotifications,
  configureNotificationHandler,
} from '../lib/notifications';
import * as Notifications from 'expo-notifications';

const mockGet = Notifications.getPermissionsAsync as jest.Mock;
const mockRequest = Notifications.requestPermissionsAsync as jest.Mock;
const mockSchedule = Notifications.scheduleNotificationAsync as jest.Mock;
const mockCancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const mockSetHandler = Notifications.setNotificationHandler as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('requestNotificationPermission', () => {
  it('returns true immediately if already granted', async () => {
    mockGet.mockResolvedValueOnce({ status: 'granted' });
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('requests permission when not granted and returns granted result', async () => {
    mockGet.mockResolvedValueOnce({ status: 'denied' });
    mockRequest.mockResolvedValueOnce({ status: 'granted' });
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('returns false when permission denied after request', async () => {
    mockGet.mockResolvedValueOnce({ status: 'denied' });
    mockRequest.mockResolvedValueOnce({ status: 'denied' });
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

describe('scheduleExpiryNotifications', () => {
  it('schedules two notifications for an expiry 10 days out', async () => {
    mockGet.mockResolvedValueOnce({ status: 'granted' });
    mockSchedule.mockResolvedValueOnce('id1').mockResolvedValueOnce('id2');
    const expiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const ids = await scheduleExpiryNotifications('Milk', expiry);
    expect(ids).toEqual(['id1', 'id2']);
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });

  it('schedules only day-of notification when expiry is tomorrow', async () => {
    mockGet.mockResolvedValueOnce({ status: 'granted' });
    mockSchedule.mockResolvedValueOnce('id1');
    // 1 day out — 2-day-before trigger is in the past
    const expiry = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const ids = await scheduleExpiryNotifications('Eggs', expiry);
    expect(ids).toHaveLength(1);
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    const callArg = mockSchedule.mock.calls[0][0];
    expect(callArg.content.title).toBe('🔴 Expires today');
  });

  it('returns empty array when permission is denied', async () => {
    mockGet.mockResolvedValueOnce({ status: 'denied' });
    mockRequest.mockResolvedValueOnce({ status: 'denied' });
    const expiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const ids = await scheduleExpiryNotifications('Cheese', expiry);
    expect(ids).toHaveLength(0);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('includes item name in notification body', async () => {
    mockGet.mockResolvedValueOnce({ status: 'granted' });
    mockSchedule.mockResolvedValue('id1');
    const expiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    await scheduleExpiryNotifications('Greek Yogurt', expiry);
    const firstCall = mockSchedule.mock.calls[0][0];
    expect(firstCall.content.body).toContain('Greek Yogurt');
  });
});

describe('cancelNotifications', () => {
  it('calls cancelScheduledNotificationAsync for each id', async () => {
    mockCancel.mockResolvedValue(undefined);
    await cancelNotifications(['id1', 'id2', 'id3']);
    expect(mockCancel).toHaveBeenCalledTimes(3);
    expect(mockCancel).toHaveBeenCalledWith('id1');
    expect(mockCancel).toHaveBeenCalledWith('id2');
    expect(mockCancel).toHaveBeenCalledWith('id3');
  });

  it('does nothing for empty array', async () => {
    await cancelNotifications([]);
    expect(mockCancel).not.toHaveBeenCalled();
  });
});

describe('configureNotificationHandler', () => {
  it('calls setNotificationHandler once', () => {
    configureNotificationHandler();
    expect(mockSetHandler).toHaveBeenCalledTimes(1);
  });

  it('handler resolves with correct display options', async () => {
    configureNotificationHandler();
    const handler = mockSetHandler.mock.calls[0][0];
    const result = await handler.handleNotification({} as any);
    expect(result.shouldShowBanner).toBe(true);
    expect(result.shouldPlaySound).toBe(true);
    expect(result.shouldSetBadge).toBe(false);
  });
});

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleExpiryNotifications(
  itemName: string,
  expiryDate: Date
): Promise<string[]> {
  const granted = await requestNotificationPermission();
  if (!granted) return [];

  const ids: string[] = [];

  const twoDaysBefore = new Date(expiryDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
  twoDaysBefore.setHours(9, 0, 0, 0);

  const dayOf = new Date(expiryDate);
  dayOf.setHours(9, 0, 0, 0);

  const now = new Date();

  if (twoDaysBefore > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🟡 Expiring soon',
        body: `Your ${itemName} expires in 2 days — need a recipe?`,
        data: { itemName },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: twoDaysBefore },
    });
    ids.push(id);
  }

  if (dayOf > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔴 Expires today',
        body: `Your ${itemName} expires today — use it up!`,
        data: { itemName },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayOf },
    });
    ids.push(id);
  }

  return ids;
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowList: true,
    }),
  });
}

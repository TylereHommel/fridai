import { Platform } from 'react-native';

// Lazy import so the module is tree-shaken on web and doesn't crash if SDK key is missing
let Purchases: typeof import('react-native-purchases').default | null = null;

function getPurchases() {
  if (!Purchases) {
    try {
      Purchases = require('react-native-purchases').default;
    } catch {
      return null;
    }
  }
  return Purchases;
}

export function initializePurchases(): void {
  if (Platform.OS === 'web') return;
  const sdk = getPurchases();
  if (!sdk) return;

  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

  if (!apiKey) return;
  sdk.configure({ apiKey });
}

export async function fetchProOffering() {
  const sdk = getPurchases();
  if (!sdk) return null;
  try {
    const offerings = await sdk.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function purchasePro(): Promise<boolean> {
  const sdk = getPurchases();
  if (!sdk) return false;
  try {
    const offering = await fetchProOffering();
    const monthly = offering?.monthly;
    if (!monthly) return false;
    const { customerInfo } = await sdk.purchasePackage(monthly);
    return Object.keys(customerInfo.entitlements.active).includes('pro');
  } catch (e: any) {
    if (e.userCancelled) return false;
    throw e;
  }
}

export async function restorePurchases(): Promise<boolean> {
  const sdk = getPurchases();
  if (!sdk) return false;
  try {
    const customerInfo = await sdk.restorePurchases();
    return Object.keys(customerInfo.entitlements.active).includes('pro');
  } catch {
    return false;
  }
}

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { getExpiryStatus, ExpiryStatus } from '../../lib/pantry';

const STATUS_STYLES: Record<ExpiryStatus, { bg: string; text: string; label: (d: Date | null) => string }> = {
  expired: { bg: '#fed7d7', text: '#c53030', label: () => 'Expired' },
  today: { bg: '#feebc8', text: '#c05621', label: () => 'Today' },
  soon: {
    bg: '#fefcbf', text: '#744210',
    label: (d) => {
      if (!d) return '';
      const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `${days}d left`;
    },
  },
  ok: {
    bg: '#c6f6d5', text: '#276749',
    label: (d) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
  },
  none: { bg: '', text: '', label: () => '' },
};

type Props = { expiryDate: Timestamp | null };

export function ExpiryBadge({ expiryDate }: Props) {
  const status = getExpiryStatus({ expiryDate });
  if (status === 'none') return null;

  const conf = STATUS_STYLES[status];
  const date = expiryDate ? expiryDate.toDate() : null;

  return (
    <View style={[styles.badge, { backgroundColor: conf.bg }]}>
      <Text style={[styles.label, { color: conf.text }]}>{conf.label(date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  label: { fontSize: 11, fontWeight: '600' },
});

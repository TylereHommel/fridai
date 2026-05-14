import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform, Modal, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import type { PantryCategory, PantryItem } from '../../lib/pantry';
import { lookupBarcode } from '../../lib/barcode';

type AddMode = 'manual' | 'barcode';
type BarcodeScanResult = { type: string; data: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Omit<PantryItem, 'id' | 'addedAt' | 'lastUpdatedAt' | 'notificationIds'>) => Promise<void>;
  initial?: Partial<PantryItem>;
};

const CATEGORIES: { key: PantryCategory; label: string; icon: string }[] = [
  { key: 'fridge', label: 'Fridge', icon: '🧊' },
  { key: 'freezer', label: 'Freezer', icon: '❄️' },
  { key: 'pantry', label: 'Pantry', icon: '🗄️' },
];

export function AddItemSheet({ visible, onClose, onSave, initial }: Props) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<AddMode>('manual');
  const [name, setName] = useState(initial?.name ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? '');
  const [category, setCategory] = useState<PantryCategory>(initial?.category ?? 'fridge');
  const [expiryDate, setExpiryDate] = useState<Date | null>(
    initial?.expiryDate ? initial.expiryDate.toDate() : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  function reset() {
    setName(''); setQuantity(''); setCategory('fridge');
    setExpiryDate(null); setMode('manual'); setBarcodeScanned(false);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter an item name.'); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        quantity: quantity.trim(),
        category,
        expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
        addedFromSessionId: null,
        barcodeData: null,
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleBarcode(code: string) {
    setShowScanner(false);
    setBarcodeLoading(true);
    try {
      const product = await lookupBarcode(code);
      if (product) {
        setName(product.name);
        setBarcodeScanned(true);
        setMode('manual');
      } else {
        Alert.alert('Not found', 'Product not found in database. Enter details manually.');
        setMode('manual');
      }
    } finally {
      setBarcodeLoading(false);
    }
  }

  function openScanner() {
    setShowScanner(true);
  }

  const inputStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }];

  return (
    <BottomSheet visible={visible} onClose={onClose} title={initial?.id ? 'Edit Item' : 'Add to Pantry'}>
      <View style={styles.tabs}>
        {(['manual', 'barcode'] as AddMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[styles.tab, mode === m && { borderBottomColor: colors.accent }]}
          >
            <Text style={[styles.tabLabel, { color: mode === m ? colors.accent : colors.textMuted }]}>
              {m === 'manual' ? '✏️  Manual' : '📷  Barcode'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'barcode' && !barcodeScanned ? (
        <View style={styles.barcodeSection}>
          {barcodeLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 24 }} />
          ) : (
            <Button label="Open Camera to Scan" onPress={openScanner} style={{ marginVertical: 8 }} />
          )}
          <Text style={[styles.barcodeHint, { color: colors.textMuted }]}>
            Scans EAN/UPC barcodes and auto-fills product name from Open Food Facts.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
          {barcodeScanned && (
            <View style={[styles.scannedBanner, { backgroundColor: colors.accent + '15' }]}>
              <Text style={[styles.scannedText, { color: colors.accent }]}>✓ Barcode scanned</Text>
            </View>
          )}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Item Name</Text>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Spinach, Chicken breast"
            placeholderTextColor={colors.textMuted}
            autoFocus={!barcodeScanned}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Quantity</Text>
          <TextInput
            style={inputStyle}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g. 2 cups, 1 bunch, 3 items"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Storage</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[
                  styles.categoryPill,
                  { borderColor: category === c.key ? colors.accent : colors.border },
                  category === c.key && { backgroundColor: colors.accent + '15' },
                ]}
              >
                <Text style={styles.categoryIcon}>{c.icon}</Text>
                <Text style={[styles.categoryLabel, { color: category === c.key ? colors.accent : colors.text }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Expiry Date (optional)</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: expiryDate ? colors.text : colors.textMuted }}>
              {expiryDate
                ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Set expiry date'}
            </Text>
            {expiryDate && (
              <TouchableOpacity onPress={() => setExpiryDate(null)}>
                <Text style={{ color: colors.danger, fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={expiryDate ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setExpiryDate(date);
              }}
              style={{ marginBottom: 8 }}
            />
          )}

          <Button
            label={saving ? 'Saving...' : 'Save Item'}
            onPress={handleSave}
            loading={saving}
            disabled={saving || !name.trim()}
            style={styles.saveBtn}
          />
        </ScrollView>
      )}

      {/* Barcode scanner modal — uses expo-barcode-scanner */}
      <BarcodeScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleBarcode}
        colors={colors}
      />
    </BottomSheet>
  );
}

function BarcodeScannerModal({
  visible, onClose, onScanned, colors,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const [scanned, setScanned] = useState(false);

  function handleScan({ data }: BarcodeScanResult) {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
  }

  if (!visible) return null;

  let ScannerView: React.ReactNode = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BarCodeScanner } = require('expo-barcode-scanner');
    ScannerView = (
      <BarCodeScanner
        onBarCodeScanned={handleScan}
        style={StyleSheet.absoluteFillObject}
      />
    );
  } catch {
    ScannerView = (
      <View style={[styles.scannerFallback, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>
          Barcode scanner unavailable. Enter item name manually.
        </Text>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => { setScanned(false); onClose(); }}>
      <View style={styles.scannerContainer}>
        {ScannerView}
        <TouchableOpacity
          style={[styles.scannerClose, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => { setScanned(false); onClose(); }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>✕ Cancel</Text>
        </TouchableOpacity>
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerReticle} />
          <Text style={styles.scannerLabel}>Point at barcode to scan</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  tab: { flex: 1, paddingBottom: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  form: { maxHeight: 480 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  categoryPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10 },
  categoryIcon: { fontSize: 16 },
  categoryLabel: { fontSize: 13, fontWeight: '500' },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  saveBtn: { marginTop: 20, marginBottom: 8 },
  barcodeSection: { alignItems: 'center', paddingVertical: 12 },
  barcodeHint: { fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  scannedBanner: { borderRadius: 8, padding: 10, marginBottom: 8 },
  scannedText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  scannerClose: { position: 'absolute', top: 56, right: 20, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 20 },
  scannerReticle: { width: 240, height: 120, borderWidth: 2, borderColor: '#fff', borderRadius: 8 },
  scannerLabel: { color: '#fff', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
});

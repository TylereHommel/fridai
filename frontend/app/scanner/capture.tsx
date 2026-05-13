import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { PhotoStrip } from '../../components/scanner/PhotoStrip';
import { useTheme } from '../../hooks/useTheme';
import { useScanSession } from '../../hooks/useScanSession';
import { getQuota } from '../../lib/cloudFunctions';

export default function CaptureScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { phase, photoUris, addPhoto, removePhoto, submitPhotos } = useScanSession();

  useEffect(() => {
    checkQuota();
  }, []);

  async function checkQuota() {
    try {
      const quota = await getQuota();
      if (quota.exceeded) {
        Alert.alert(
          'Session limit reached',
          `You've used all ${quota.limit} free sessions this month.`,
          [{ text: 'Upgrade', onPress: () => router.back() }, { text: 'Cancel', onPress: () => router.back() }]
        );
      }
    } catch {}
  }

  async function handleAddPhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      addPhoto(result.assets[0].uri);
    }
  }

  async function handleDone() {
    if (photoUris.length === 0) return;
    await submitPhotos();
    router.push('/scanner/review' as any);
  }

  const isLoading = phase === 'uploading' || phase === 'detecting';

  return (
    <ScreenWrapper>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Scan Fridge</Text>
        {photoUris.length > 0 && !isLoading ? (
          <TouchableOpacity onPress={handleDone}>
            <Text style={[styles.done, { color: colors.accent }]}>Done ✓</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {phase === 'uploading' ? 'Uploading photos...' : 'Detecting ingredients...'}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.tipBox, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '30' }]}>
              <Text style={[styles.tipText, { color: colors.accent }]}>
                💡 Open drawers, shelves, and door panels. All photos count as one session.
              </Text>
            </View>

            {photoUris.length > 0 && (
              <PhotoStrip uris={photoUris} onAdd={handleAddPhoto} onRemove={removePhoto} />
            )}

            <Button
              label={photoUris.length === 0 ? '📷  Take First Photo' : '📷  Add Another Photo'}
              onPress={handleAddPhoto}
              variant={photoUris.length === 0 ? 'primary' : 'secondary'}
              style={styles.cameraBtn}
            />
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  cancel: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  done: { fontSize: 16, fontWeight: '600' },
  body: { flexGrow: 1, padding: 20, gap: 16 },
  tipBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  tipText: { fontSize: 14, lineHeight: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 80 },
  loadingText: { fontSize: 16 },
  cameraBtn: { marginTop: 8 },
});

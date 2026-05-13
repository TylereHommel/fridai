import React from 'react';
import { View, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  uris: string[];
  onAdd: () => void;
  onRemove: (uri: string) => void;
};

const THUMB_SIZE = 80;

export function PhotoStrip({ uris, onAdd, onRemove }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.content}>
      {uris.map((uri) => (
        <View key={uri} style={styles.thumb}>
          <Image source={{ uri }} style={styles.img} />
          <TouchableOpacity
            style={[styles.remove, { backgroundColor: colors.danger }]}
            onPress={() => onRemove(uri)}
          >
            <Ionicons name="close" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={28} color={colors.accent} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { flexGrow: 0 },
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, alignItems: 'center' },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12, overflow: 'hidden' },
  img: { width: THUMB_SIZE, height: THUMB_SIZE },
  remove: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});

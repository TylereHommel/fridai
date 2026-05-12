import React from 'react';
import { View, ViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

type Props = ViewProps & {
  children: React.ReactNode;
  edges?: Edge[];
};

export function ScreenWrapper({ children, edges = ['top', 'bottom'], style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={edges}>
      <View style={[{ flex: 1, backgroundColor: colors.background }, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

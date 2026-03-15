import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Shadows } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  elevated?: boolean;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  elevated = false,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.sm },
        elevated && styles.elevated,
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            testID="back-button" // ← ADD
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          {rightElement ?? <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  elevated: { ...Shadows.sm },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  backBtn: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  backIcon: {
    fontSize: 34,
    lineHeight: 40,
    color: Colors.primary,
    fontWeight: Typography.weights.regular,
    marginTop: Platform.OS === 'android' ? -4 : 0,
  },
  titleBlock: { flex: 1, alignItems: 'center' },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: { width: 40, alignItems: 'flex-end' },
  placeholder: { width: 40 },
});

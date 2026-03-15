import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '../../theme';

interface Props {
  initials: string;
  color: string;
  size?: number;
}

export default function DoctorAvatar({ initials, color, size = 48 }: Props) {
  const fontSize = size * 0.35;
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
});

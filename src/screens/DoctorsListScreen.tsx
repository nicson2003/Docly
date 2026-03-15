import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchDoctors, clearError } from '../store/slices/doctorsSlice';
import { Colors, Typography, Spacing } from '../theme';
import DoctorCard from '../components/doctors/DoctorCard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function DoctorsListScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { items: doctors, loading, error } = useAppSelector(s => s.doctors);

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(clearError());
    dispatch(fetchDoctors({ forceRefresh: true }));
  }, [dispatch]);

  const handleDoctorPress = useCallback(
    (doctorId: string) => {
      navigation.navigate('DoctorDetail', { doctorId });
    },
    [navigation],
  );

  if (loading && doctors.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <HeaderContent />
        </View>
        <LoadingState message="Loading doctors..." />
      </View>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <HeaderContent />
        </View>
        <ErrorState message={error} onRetry={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={doctors}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DoctorCard doctor={item} onPress={handleDoctorPress} />
        )}
        ListHeaderComponent={
          <View
            style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
          >
            <HeaderContent />
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️ {error}</Text>
                <TouchableOpacity onPress={handleRefresh}>
                  <Text style={styles.retryInline}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.sectionTitle}>
              {doctors.length} Doctor{doctors.length !== 1 ? 's' : ''} Available
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="🩺"
            title="No doctors found"
            subtitle="Pull down to refresh and try again."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={
          doctors.length === 0 ? styles.emptyContent : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function HeaderContent() {
  return (
    <View style={styles.headerContent}>
      <View>
        <Text style={styles.greeting}>Docly</Text>
        <Text style={styles.headerTitle}>Find a Doctor</Text>
        <Text style={styles.headerSub}>Book a 30-minute appointment today</Text>
      </View>
      <View style={styles.logoCircle}>
        <Text style={styles.logoEmoji}>⚕️</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: Spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textInverse,
    marginTop: 2,
  },
  headerSub: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 26,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  emptyContent: {
    flexGrow: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorBannerText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.textInverse,
  },
  retryInline: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.textInverse,
    textDecorationLine: 'underline',
    marginLeft: Spacing.sm,
  },
});

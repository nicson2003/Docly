/* eslint-disable react/no-unstable-nested-components */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { RootStackParamList, BottomTabParamList } from '../types';
import { Colors, Typography, Spacing } from '../theme';

import DoctorsListScreen from '../screens/DoctorsListScreen';
import DoctorDetailScreen from '../screens/DoctorDetailScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import BookingSuccessScreen from '../screens/BookingSuccessScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import { useAppSelector } from '../hooks/useRedux';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

function DoctorsIcon({ focused }: { focused: boolean }) {
  const color = focused ? Colors.tabActive : Colors.tabInactive;
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, { color }]}>⚕</Text>
    </View>
  );
}

function BookingsIcon({ focused }: { focused: boolean }) {
  const color = focused ? Colors.tabActive : Colors.tabInactive;
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, { color }]}>📋</Text>
    </View>
  );
}

function MainTabs() {
  const bookingItems = useAppSelector(state => state.bookings.items);
  const activeBookings = useMemo(
    () => bookingItems.filter(b => b.status === 'confirmed'),
    [bookingItems],
  );
  const badgeCount = activeBookings.length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsListScreen}
        options={{
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ focused }) => <DoctorsIcon focused={focused} />,
          tabBarButtonTestID: 'tab-DoctorsTab', // ← ADD
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={MyBookingsScreen}
        options={{
          tabBarLabel: 'My Bookings',
          tabBarBadge: badgeCount > 0 ? badgeCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarIcon: ({ focused }) => <BookingsIcon focused={focused} />,
          tabBarButtonTestID: 'tab-BookingsTab', // ← ADD
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="BookingSuccess"
          component={BookingSuccessScreen}
          options={{ presentation: 'modal', animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  tabLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabIconActive: { backgroundColor: Colors.primarySurface },
  tabIconText: { fontSize: 18 },
  badge: {
    backgroundColor: Colors.error,
    color: Colors.textInverse,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
});

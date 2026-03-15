import 'react-native/jest/setup';

// ─── AsyncStorage Mock ───────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}));

// ─── react-native-safe-area-context ─────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

// ─── react-native-screens ────────────────────────────────────────────────────
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// ─── @react-navigation ───────────────────────────────────────────────────────
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// ─── redux-persist ───────────────────────────────────────────────────────────
jest.mock('redux-persist', () => {
  const actual = jest.requireActual('redux-persist');
  return {
    ...actual,
    persistReducer: (_config, reducer) => reducer,
    persistStore: () => ({ persist: jest.fn() }),
  };
});

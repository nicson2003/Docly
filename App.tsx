import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingState from './src/components/common/LoadingState';
import { Colors } from './src/theme';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<LoadingState message="Restoring your data..." />}
        persistor={persistor}
      >
        <SafeAreaProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Colors.primary}
            translucent={false}
          />
          <AppNavigator />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

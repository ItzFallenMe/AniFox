import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { hydrateSettings } from './src/hooks/useSettings';
import { hydrateLibrary } from './src/hooks/useLibrary';

function App() {
  useEffect(() => {
    hydrateSettings();
    hydrateLibrary();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;

import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { hydrateSettings } from './src/hooks/useSettings';
import { hydrateLibrary } from './src/hooks/useLibrary';
import { hydrateDownloads } from './src/services/downloads';
import { hydrateUpdateDismissal } from './src/services/updates';

function App() {
  useEffect(() => {
    hydrateSettings();
    hydrateLibrary();
    hydrateDownloads();
    hydrateUpdateDismissal();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;

import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { hydrateSettings } from './src/hooks/useSettings';
import { hydrateSubtitleSettings } from './src/hooks/useSubtitleSettings';
import { hydrateServerPreference } from './src/services/serverPreference';

function App() {
  useEffect(() => {
    hydrateSettings();
    hydrateSubtitleSettings();
    hydrateServerPreference();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;

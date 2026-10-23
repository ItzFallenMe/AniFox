import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { BrowseScreen } from '../screens/BrowseScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { AnimeScreen } from '../screens/AnimeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { TabBar } from './TabBar';
import type { MainTabParamList, RootStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

const MainTabs = () => (
  <Tabs.Navigator
    screenOptions={{
      headerShown: false,
      sceneStyle: { backgroundColor: colors.background },
      animation: 'fade',
    }}
    tabBar={renderTabBar}>
    <Tabs.Screen name="Home" component={HomeScreen} />
    <Tabs.Screen name="Browse" component={BrowseScreen} />
    <Tabs.Screen name="Anime" component={AnimeScreen} />
    <Tabs.Screen name="Search" component={SearchScreen} />
    <Tabs.Screen name="You" component={ProfileScreen} />
  </Tabs.Navigator>
);

export const RootNavigator = () => (
  <NavigationContainer theme={navigationTheme}>
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Watchlist" component={WatchlistScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

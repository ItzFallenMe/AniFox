import type { NavigatorScreenParams } from '@react-navigation/native';

import type { CatalogKey } from '../config/catalogs';
import type { MediaItem } from '../types';

export type MainTabParamList = {
  Home: undefined;
  Browse: undefined;
  Anime: undefined;
  Search: undefined;
  You: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Detail: { item: MediaItem };
  Catalog: { key: CatalogKey };
  Settings: undefined;
  Watchlist: undefined;
  Alerts: undefined;
  Downloads: undefined;
  Player: {
    item: MediaItem;
    season?: number;
    episode?: number;
    episodeName?: string;
  };
};

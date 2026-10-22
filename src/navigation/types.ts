import type { NavigatorScreenParams } from '@react-navigation/native';

import type { MediaItem } from '../types';

export type MainTabParamList = {
  Home: undefined;
  Anime: undefined;
  Search: undefined;
  You: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Detail: { item: MediaItem };
  Player: {
    item: MediaItem;
    season?: number;
    episode?: number;
    episodeName?: string;
  };
};

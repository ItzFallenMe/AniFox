import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';

import { colors, fonts, radius, spacing } from '../theme';
import { Kicker } from './ui/Primitives';

interface TrailerModalProps {
  /** YouTube video id, or null when the sheet is closed. */
  videoKey: string | null;
  title: string;
  onClose: () => void;
}

/**
 * Cinematic trailer sheet. The player is unmounted when `videoKey` is null so
 * closing the sheet also stops playback and audio.
 */
export const TrailerModal = ({ videoKey, title, onClose }: TrailerModalProps) => {
  const { width } = useWindowDimensions();
  const frameWidth = width - spacing.xl * 2;

  return (
    <Modal
      visible={videoKey != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close trailer"
        onPress={onClose}
        style={styles.backdrop}>
        <Pressable onPress={() => {}} style={[styles.sheet, { width: frameWidth }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Kicker>Trailer</Kicker>
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close trailer"
              onPress={onClose}
              hitSlop={12}
              style={styles.close}>
              <X color={colors.text} size={17} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={[styles.frame, { height: (frameWidth - 2) * (9 / 16) }]}>
            {videoKey ? (
              <WebView
                source={{
                  uri: `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
                }}
                style={styles.web}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['https://*']}
              />
            ) : null}
          </View>

          <Text style={styles.note}>Trailers are streamed from YouTube.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: colors.text,
    marginTop: 1,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: { backgroundColor: '#000000' },
  web: { flex: 1, backgroundColor: '#000000' },
  note: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});

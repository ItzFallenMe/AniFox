import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { colors, fonts, spacing } from '../theme';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Windowed page numbers: first, current ± 1, last, with ellipses between. */
const pageWindow = (page: number, totalPages: number): (number | 'gap')[] => {
  const last = totalPages;
  const start = Math.max(2, page - 1);
  const end = Math.min(last - 1, page + 1);

  if (last <= 5) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const pages: (number | 'gap')[] = [1];
  if (start > 2) pages.push('gap');
  for (let index = start; index <= end; index += 1) pages.push(index);
  if (end < last - 1) pages.push('gap');
  pages.push(last);
  return pages;
};

/** The pagination bar sarui-movies puts under every catalog page. */
export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
        style={({ pressed }) => [
          styles.step,
          page <= 1 && styles.disabled,
          pressed && styles.pressed,
        ]}>
        <ChevronLeft color={colors.textSecondary} size={13} strokeWidth={2.4} />
        <Text style={styles.stepText}>Previous</Text>
      </Pressable>

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === 'gap' ? (
          <Text key={`gap-${index}`} style={styles.gap}>
            …
          </Text>
        ) : (
          <Pressable
            key={entry}
            accessibilityRole="button"
            accessibilityLabel={`Page ${entry}`}
            accessibilityState={{ selected: entry === page }}
            onPress={() => onChange(entry)}
            style={({ pressed }) => [
              styles.pageButton,
              entry === page && styles.pageActive,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.pageText, entry === page && styles.pageTextActive]}>
              {entry}
            </Text>
          </Pressable>
        ),
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next page"
        disabled={page >= totalPages}
        onPress={() => onChange(page + 1)}
        style={({ pressed }) => [
          styles.step,
          page >= totalPages && styles.disabled,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.stepText}>Next</Text>
        <ChevronRight color={colors.textSecondary} size={13} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stepText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  pageButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pageText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  pageTextActive: { color: colors.onPrimary, fontFamily: fonts.bodyBold },
  gap: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
    paddingHorizontal: 2,
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
});

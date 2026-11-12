import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart';

import 'package:anifox/common/state/ui_prefs_provider.dart';

/// Floating glass surface for navigation chrome.
///
/// Uses the `liquid_glass_widgets` shader pipeline when the user has Liquid
/// Glass enabled, and falls back to a plain translucent surface otherwise.
class LiquidGlass extends ConsumerWidget {
  const LiquidGlass({
    super.key,
    required this.child,
    this.radius = 24,
    this.blur = 5,
    this.thickness = 20,
    this.glassColor,
    this.fallbackColor,
    this.padding = EdgeInsets.zero,
    this.height,
  });

  final Widget child;
  final double radius;
  final double blur;
  final double thickness;
  final Color? glassColor;
  final Color? fallbackColor;
  final EdgeInsetsGeometry padding;
  final double? height;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = ref.watch(
      uiPrefsProvider.select((prefs) => prefs.liquidGlass),
    );
    final cs = Theme.of(context).colorScheme;

    if (!enabled) {
      return Container(
        height: height,
        padding: padding,
        decoration: BoxDecoration(
          color: (fallbackColor ?? cs.surfaceContainerHigh).withValues(
            alpha: 0.94,
          ),
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(
            color: cs.outlineVariant.withValues(alpha: 0.3),
          ),
        ),
        child: child,
      );
    }

    return SizedBox(
      height: height,
      child: GlassContainer(
        useOwnLayer: true,
        quality: GlassQuality.standard,
        shape: LiquidRoundedSuperellipse(borderRadius: radius),
        padding: padding,
        settings: LiquidGlassSettings(
          thickness: thickness,
          blur: blur,
          glassColor:
              glassColor ??
              cs.surfaceContainerHigh.withValues(alpha: 0.18),
          lightIntensity: 0.5,
          saturation: 1.4,
        ),
        child: child,
      ),
    );
  }
}

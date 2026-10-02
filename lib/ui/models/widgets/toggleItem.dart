import 'dart:io';

import 'package:anifox/core/app/appearance.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/ui/pages/settingPages/common.dart';
import 'package:flutter/material.dart';

class ToggleItem extends StatelessWidget {
  final VoidCallback onTapFunction;
  final String label;
  final String? description;
  final bool value;
  final bool mobileOnly;
  final bool enabled;
  final IconData? leadingIcon;

  const ToggleItem({
    super.key,
    required this.onTapFunction,
    required this.label,
    this.description,
    required this.value,
    this.mobileOnly = false,
    this.enabled = true,
    this.leadingIcon,
  });

  @override
  Widget build(BuildContext context) {
    if (mobileOnly && !Platform.isAndroid) return SizedBox.shrink();
    final opacity = enabled ? 1.0 : 0.45;
    return Opacity(
      opacity: opacity,
      child: InkWell(
        onTap: enabled
            ? () {
                softHaptic(HapticIntensity.selection);
                onTapFunction();
              }
            : null,
        child: Container(
          padding: EdgeInsets.only(top: 10, bottom: 10, left: 10, right: 10),
          child: Container(
            padding: EdgeInsets.only(
              left: 10,
              right: 10,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (leadingIcon != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Icon(leadingIcon, color: appTheme.accentColor, size: 24),
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: textStyle(),
                      ),
                      if (description != null)
                        Text(
                          description!,
                          style: textStyle().copyWith(color: appTheme.textSubColor, fontSize: 12),
                        ),
                    ],
                  ),
                ),
                Switch(
                  value: value,
                  onChanged: enabled
                      ? (val) {
                          softHaptic(HapticIntensity.selection);
                          onTapFunction();
                        }
                      : null,
                  inactiveTrackColor: appTheme.backgroundColor,
                  activeThumbColor: appTheme.backgroundColor,
                  activeTrackColor: appTheme.accentColor,
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}

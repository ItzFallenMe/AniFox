import 'package:anifox/core/app/appearance.dart';
import 'package:anifox/core/app/runtimeDatas.dart';
import 'package:anifox/ui/pages/settingPages/common.dart';
import 'package:flutter/material.dart';

// Represents the button tiles which are clickable in setting screen
class ClickableItem extends StatelessWidget {
  final VoidCallback onTap;
  final String label;
  final String? description;
  final Icon? suffixIcon;
  final EdgeInsets? contentPadding;
  final BorderRadius? borderRadius;
  final bool enabled;
  final String? badge;
  final IconData? leadingIcon;
  const ClickableItem({
    super.key,
    required this.onTap,
    required this.label,
    this.description,
    this.suffixIcon,
    this.borderRadius,
    this.contentPadding = const EdgeInsets.only(left: 20, right: 20, top: 10, bottom: 10),
    this.enabled = true,
    this.badge,
    this.leadingIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.45,
      child: InkWell(
        onTap: enabled
            ? () {
                softHaptic(HapticIntensity.selection);
                onTap();
              }
            : null,
        borderRadius: borderRadius,
        child: Container(
          padding: contentPadding,
          width: double.infinity,
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
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            label,
                            style: textStyle(),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (badge != null)
                          Container(
                            margin: const EdgeInsets.only(left: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: appTheme.accentColor,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              badge!,
                              style: TextStyle(
                                color: appTheme.onAccent,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (description != null)
                      Text(
                        description!,
                        style: textStyle().copyWith(color: appTheme.textSubColor, fontSize: 12),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              if (suffixIcon != null) suffixIcon!,
            ],
          ),
        ),
      ),
    );
  }
}

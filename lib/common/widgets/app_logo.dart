import 'package:flutter/material.dart';

/// The AniFox brand mark, rendered from the bundled logo asset.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 56, this.radius});

  final double size;
  final BorderRadius? radius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: radius ?? BorderRadius.circular(size * 0.22),
      child: Image.asset(
        'assets/images/app_logo.png',
        width: size,
        height: size,
        fit: BoxFit.cover,
        filterQuality: FilterQuality.medium,
      ),
    );
  }
}

import 'package:anifox/ui/models/widgets/player/mobileControls/mobileControls.dart';
import 'package:flutter/material.dart';

/// A wrapper class for selecting platform-specific controls
class Controls extends StatelessWidget {
  const Controls({super.key});

  @override
  Widget build(BuildContext context) {
    return const MobileControls();
  }
}

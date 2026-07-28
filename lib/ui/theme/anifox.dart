import 'package:anifox/ui/theme/types.dart';
import 'package:flutter/material.dart';

/// AniFox brand theme — orange/amber fox palette
class AniFoxBrand implements ThemeItem {
  @override
  int get id => 00;

  @override
  String get name => "AniFox";

  @override
  bool get dev => false;

  @override
  AniFoxTheme get lightVariant => AniFoxTheme(
        accentColor: Color(0xFFF97316),
        backgroundColor: Colors.white,
        backgroundSubColor: Color(0xFFF3F4F6),
        textMainColor: Color(0xFF1A1A1A),
        textSubColor: Color(0xFF6B7280),
        modalSheetBackgroundColor: Colors.white,
        onAccent: Colors.white,
      );

  @override
  AniFoxTheme get theme => AniFoxTheme(
        accentColor: Color(0xFFF97316),
        backgroundColor: Color(0xFF141414),
        backgroundSubColor: Color(0xFF1F1F1F),
        textMainColor: Colors.white,
        textSubColor: Color(0xFF9CA3AF),
        modalSheetBackgroundColor: Color(0xFF0F0F0F),
        onAccent: Colors.white,
      );
}

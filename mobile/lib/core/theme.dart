import 'package:flutter/material.dart';

class AppTheme {
  // Color Palette - Modern & Professional
  static const Color primaryColor = Color(0xFF6366F1); // Indigo
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF4F46E5);

  static const Color secondaryColor = Color(0xFF10B981); // Emerald
  static const Color errorColor = Color(0xFFEF4444);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color successColor = Color(0xFF10B981);

  // Light Theme Colors
  static const Color lightBackground = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightBorder = Color(0xFFE2E8F0);

  // Dark Theme Colors
  static const Color darkBackground = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkTextPrimary = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkBorder = Color(0xFF334155);

  // Typography Scale
  static const TextStyle displayLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  );

  static const TextStyle headlineMedium = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.3,
  );

  static const TextStyle titleLarge = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    height: 1.5,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
  );

  // Spacing System
  static const double spacingXS = 4;
  static const double spacingSM = 8;
  static const double spacingMD = 16;
  static const double spacingLG = 24;
  static const double spacingXL = 32;
  static const double spacingXXL = 48;

  // Border Radius
  static const double radiusSM = 8;
  static const double radiusMD = 12;
  static const double radiusLG = 16;
  static const double radiusXL = 24;

  // Shadows
  static List<BoxShadow> get shadowSM => [
    BoxShadow(
      color: Colors.black.withOpacity(0.05),
      offset: const Offset(0, 1),
      blurRadius: 2,
    ),
  ];

  static List<BoxShadow> get shadowMD => [
    BoxShadow(
      color: Colors.black.withOpacity(0.1),
      offset: const Offset(0, 4),
      blurRadius: 6,
    ),
  ];

  static List<BoxShadow> get shadowLG => [
    BoxShadow(
      color: Colors.black.withOpacity(0.15),
      offset: const Offset(0, 10),
      blurRadius: 15,
    ),
  ];

  // Light Theme
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    fontFamily: 'Vazirmatn',

    colorScheme: ColorScheme.light(
      primary: primaryColor,
      secondary: secondaryColor,
      error: errorColor,
      surface: lightSurface,
      background: lightBackground,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onError: Colors.white,
      onSurface: lightTextPrimary,
      onBackground: lightTextPrimary,
    ),

    scaffoldBackgroundColor: lightBackground,
    cardColor: lightSurface,

    appBarTheme: AppBarTheme(
      backgroundColor: lightSurface,
      foregroundColor: lightTextPrimary,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: titleLarge.copyWith(color: lightTextPrimary),
    ),

    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusMD),
        side: BorderSide(color: lightBorder),
      ),
      color: lightSurface,
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: lightSurface,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: spacingMD,
        vertical: spacingMD,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: lightBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: lightBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: errorColor),
      ),
      labelStyle: bodyMedium.copyWith(color: lightTextSecondary),
      hintStyle: bodyMedium.copyWith(color: lightTextSecondary),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSM),
        ),
        padding: const EdgeInsets.symmetric(vertical: spacingMD),
        textStyle: bodyLarge.copyWith(fontWeight: FontWeight.w600),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        textStyle: bodyMedium.copyWith(fontWeight: FontWeight.w600),
      ),
    ),

    chipTheme: ChipThemeData(
      backgroundColor: lightSurface,
      selectedColor: primaryLight.withOpacity(0.2),
      labelStyle: bodyMedium,
      padding: const EdgeInsets.symmetric(horizontal: spacingSM),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusSM),
      ),
    ),
  );

  // Dark Theme
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    fontFamily: 'Vazirmatn',

    colorScheme: ColorScheme.dark(
      primary: primaryLight,
      secondary: secondaryColor,
      error: errorColor,
      surface: darkSurface,
      background: darkBackground,
      onPrimary: darkSurface,
      onSecondary: Colors.white,
      onError: Colors.white,
      onSurface: darkTextPrimary,
      onBackground: darkTextPrimary,
    ),

    scaffoldBackgroundColor: darkBackground,
    cardColor: darkSurface,

    appBarTheme: AppBarTheme(
      backgroundColor: darkSurface,
      foregroundColor: darkTextPrimary,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: titleLarge.copyWith(color: darkTextPrimary),
    ),

    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusMD),
        side: BorderSide(color: darkBorder),
      ),
      color: darkSurface,
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: darkSurface,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: spacingMD,
        vertical: spacingMD,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: darkBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: darkBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: primaryLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSM),
        borderSide: const BorderSide(color: errorColor),
      ),
      labelStyle: bodyMedium.copyWith(color: darkTextSecondary),
      hintStyle: bodyMedium.copyWith(color: darkTextSecondary),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSM),
        ),
        padding: const EdgeInsets.symmetric(vertical: spacingMD),
        textStyle: bodyLarge.copyWith(fontWeight: FontWeight.w600),
      ),
    ),
  );
}

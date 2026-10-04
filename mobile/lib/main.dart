import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme.dart';
import 'services/storage_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize storage service
  await StorageService().init();

  runApp(
    const ProviderScope(
      child: B2BApp(),
    ),
  );
}

class B2BApp extends ConsumerWidget {
  const B2BApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp.router(
      title: 'B2B Sales Platform',
      debugShowCheckedModeBanner: false,

      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,

      // Localization - Persian/RTL
      locale: const Locale('fa', 'IR'),
      supportedLocales: const [
        Locale('fa', 'IR'),
        Locale('en', 'US'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      // Router
      routerConfig: GoRouter(
        initialLocation: '/',
        redirect: (context, state) {
          final isLoggedIn = authState.value != null;
          final isLoggingIn = state.matchedLocation == '/';

          if (!isLoggedIn && !isLoggingIn) {
            return '/';
          }

          if (isLoggedIn && isLoggingIn) {
            return '/dashboard';
          }

          return null;
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const LoginScreen(),
          ),
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
        ],
      ),
    );
  }
}

// Note: Add go_router to pubspec.yaml dependencies:
// go_router: ^13.0.0

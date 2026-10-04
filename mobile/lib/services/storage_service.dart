import 'package:shared_preferences/shared_preferences.dart';
import '../core/config.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  SharedPreferences? _prefs;

  factory StorageService() => _instance;

  StorageService._internal();

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Auth tokens
  Future<void> saveAccessToken(String token) async {
    await _prefs?.setString(AppConfig.accessTokenKey, token);
  }

  String? getAccessToken() {
    return _prefs?.getString(AppConfig.accessTokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _prefs?.setString(AppConfig.refreshTokenKey, token);
  }

  String? getRefreshToken() {
    return _prefs?.getString(AppConfig.refreshTokenKey);
  }

  Future<void> saveUserId(String userId) async {
    await _prefs?.setString(AppConfig.userIdKey, userId);
  }

  String? getUserId() {
    return _prefs?.getString(AppConfig.userIdKey);
  }

  // Clear all auth data
  Future<void> clearAuth() async {
    await _prefs?.remove(AppConfig.accessTokenKey);
    await _prefs?.remove(AppConfig.refreshTokenKey);
    await _prefs?.remove(AppConfig.userIdKey);
  }

  // Theme preference
  Future<void> setDarkMode(bool value) async {
    await _prefs?.setBool('dark_mode', value);
  }

  bool getDarkMode() {
    return _prefs?.getBool('dark_mode') ?? false;
  }

  // Language
  Future<void> setLanguage(String lang) async {
    await _prefs?.setString('language', lang);
  }

  String getLanguage() {
    return _prefs?.getString('language') ?? 'fa';
  }
}

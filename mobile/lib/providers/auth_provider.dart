import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
final storageServiceProvider = Provider<StorageService>((ref) => StorageService());

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(
    ref.watch(apiServiceProvider),
    ref.watch(storageServiceProvider),
  );
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final ApiService _apiService;
  final StorageService _storageService;

  AuthNotifier(this._apiService, this._storageService) : super(const AsyncValue.data(null)) {
    _loadUser();
  }

  Future<void> _loadUser() async {
    final token = _storageService.getAccessToken();
    if (token != null) {
      _apiService.setAccessToken(token);
      // In a real app, you'd fetch user profile here
    }
  }

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();

    try {
      final response = await _apiService.login(email, password);
      final data = response['data'];

      final accessToken = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String;
      final userData = data['user'] as Map<String, dynamic>;

      await _storageService.saveAccessToken(accessToken);
      await _storageService.saveRefreshToken(refreshToken);
      await _storageService.saveUserId(userData['id']);

      _apiService.setAccessToken(accessToken);

      final user = UserModel.fromJson(userData);
      state = AsyncValue.data(user);

      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }

  Future<void> logout() async {
    await _storageService.clearAuth();
    _apiService.clearToken();
    state = const AsyncValue.data(null);
  }
}

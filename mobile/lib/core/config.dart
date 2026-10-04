class AppConfig {
  static const String baseUrl = 'https://visitor.absadeghi.ir';
  static const String apiBaseUrl = '$baseUrl/api/v1';

  // JWT Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';

  // Pagination
  static const int defaultPageSize = 20;

  // Sync Configuration
  static const Duration syncRetryDelay = Duration(seconds: 2);
  static const int maxSyncRetries = 5;
}

import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../core/config.dart';

class ApiService {
  late final Dio _dio;
  String? _accessToken;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    if (const bool.fromEnvironment('dart.vm.product') == false) {
      _dio.interceptors.add(PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
      ));
    }

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired - could implement refresh logic here
        }
        return handler.next(error);
      },
    ));
  }

  void setAccessToken(String token) {
    _accessToken = token;
  }

  void clearToken() {
    _accessToken = null;
  }

  // Auth
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    try {
      final response = await _dio.post('/auth/refresh', data: {
        'refresh_token': refreshToken,
      });
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Products
  Future<Map<String, dynamic>> getProducts({
    int page = 1,
    int perPage = 20,
    String? search,
    String? categoryId,
    String? status,
    bool? inStock,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'per_page': perPage,
      };

      if (search != null) queryParams['search'] = search;
      if (categoryId != null) queryParams['category_id'] = categoryId;
      if (status != null) queryParams['status'] = status;
      if (inStock != null) queryParams['in_stock'] = inStock;

      final response = await _dio.get('/products', queryParameters: queryParams);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getProduct(String productId) async {
    try {
      final response = await _dio.get('/products/$productId');
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Customers
  Future<Map<String, dynamic>> getCustomers({
    int page = 1,
    int perPage = 20,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'per_page': perPage,
      };

      if (search != null) queryParams['search'] = search;

      final response = await _dio.get('/customers', queryParameters: queryParams);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> createCustomer(Map<String, dynamic> customerData) async {
    try {
      final response = await _dio.post('/customers', data: customerData);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Orders
  Future<Map<String, dynamic>> getOrders({
    int page = 1,
    int perPage = 20,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'per_page': perPage,
      };

      if (status != null) queryParams['status'] = status;

      final response = await _dio.get('/orders', queryParameters: queryParams);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    try {
      final response = await _dio.post('/orders', data: orderData);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Dashboard
  Future<Map<String, dynamic>> getSellerDashboard() async {
    try {
      final response = await _dio.get('/dashboard/seller');
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response?.data;
      if (data is Map && data['error'] != null) {
        return data['error']['message'] ?? 'خطایی رخ داده است';
      }
      return 'خطای سرور: ${error.response?.statusCode}';
    }
    return 'خطا در ارتباط با سرور';
  }
}

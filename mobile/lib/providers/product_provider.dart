import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';
import '../services/api_service.dart';

final productProvider = StateNotifierProvider<ProductNotifier, AsyncValue<List<ProductModel>>>((ref) {
  return ProductNotifier(ref.watch(apiServiceProvider));
});

class ProductNotifier extends StateNotifier<AsyncValue<List<ProductModel>>> {
  final ApiService _apiService;

  ProductNotifier(this._apiService) : super(const AsyncValue.data([]));

  Future<void> loadProducts({
    int page = 1,
    String? search,
    bool? inStock,
  }) async {
    state = const AsyncValue.loading();

    try {
      final response = await _apiService.getProducts(
        page: page,
        perPage: 20,
        search: search,
        inStock: inStock,
      );

      final data = response['data'] as List;
      final products = data.map((json) => ProductModel.fromJson(json)).toList();

      if (page == 1) {
        state = AsyncValue.data(products);
      } else {
        final current = state.value ?? [];
        state = AsyncValue.data([...current, ...products]);
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }
}

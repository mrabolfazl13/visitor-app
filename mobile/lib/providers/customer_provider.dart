import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/customer.dart';
import '../services/api_service.dart';
import 'auth_provider.dart';

final customerProvider = StateNotifierProvider<CustomerNotifier, AsyncValue<List<CustomerModel>>>((ref) {
  return CustomerNotifier(ref.watch(apiServiceProvider));
});

class CustomerNotifier extends StateNotifier<AsyncValue<List<CustomerModel>>> {
  final ApiService _apiService;

  CustomerNotifier(this._apiService) : super(const AsyncValue.data([]));

  Future<void> loadCustomers({int page = 1, String? search}) async {
    state = const AsyncValue.loading();

    try {
      final response = await _apiService.getCustomers(
        page: page,
        perPage: 20,
        search: search,
      );

      final data = response['data'] as List;
      final customers = data.map((json) => CustomerModel.fromJson(json)).toList();

      if (page == 1) {
        state = AsyncValue.data(customers);
      } else {
        final current = state.value ?? [];
        state = AsyncValue.data([...current, ...customers]);
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<bool> createCustomer(CustomerModel customer) async {
    try {
      await _apiService.createCustomer(customer.toJson());
      await loadCustomers();
      return true;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';

class CartItem {
  final ProductModel product;
  int quantity;

  CartItem({required this.product, required this.quantity});

  double get subtotal => product.unitPrice * quantity;
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void addItem(ProductModel product, int quantity) {
    final existingIndex = state.indexWhere((item) => item.product.id == product.id);

    if (existingIndex >= 0) {
      final newState = [...state];
      newState[existingIndex].quantity += quantity;
      state = newState;
    } else {
      state = [...state, CartItem(product: product, quantity: quantity)];
    }
  }

  void removeItem(String productId) {
    state = state.where((item) => item.product.id != productId).toList();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    final index = state.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      final newState = [...state];
      newState[index].quantity = quantity;
      state = newState;
    }
  }

  void clear() {
    state = [];
  }

  double get total {
    return state.fold(0, (sum, item) => sum + item.subtotal);
  }

  int get itemCount {
    return state.fold(0, (sum, item) => sum + item.quantity);
  }

  Map<String, dynamic> toJson() {
    return {
      'items': state.map((item) => {
        'product_id': item.product.id,
        'quantity': item.quantity,
      }).toList(),
    };
  }
}

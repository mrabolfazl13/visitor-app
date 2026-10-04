class OrderModel {
  final String id;
  final String orderNumber;
  final String customerId;
  final String sellerId;
  final String status;
  final double? totalAmount;
  final String? rejectionReason;
  final DateTime createdAt;
  final List<OrderItemModel> items;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.sellerId,
    required this.status,
    this.totalAmount,
    this.rejectionReason,
    required this.createdAt,
    this.items = const [],
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      orderNumber: json['order_number'] ?? '',
      customerId: json['customer_id'] ?? '',
      sellerId: json['seller_id'] ?? '',
      status: json['status'] ?? 'DRAFT',
      totalAmount: double.tryParse(json['total_amount']?.toString() ?? '0'),
      rejectionReason: json['rejection_reason'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      items: (json['items'] as List?)
              ?.map((item) => OrderItemModel.fromJson(item))
              .toList() ??
          [],
    );
  }

  bool get isDraft => status == 'DRAFT';
  bool get isPendingApproval => status == 'PENDING_APPROVAL';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_number': orderNumber,
      'customer_id': customerId,
      'seller_id': sellerId,
      'status': status,
      'total_amount': totalAmount,
      'rejection_reason': rejectionReason,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class OrderItemModel {
  final String id;
  final String orderId;
  final String productId;
  final int quantity;
  final double unitPrice;
  final double subtotal;

  OrderItemModel({
    required this.id,
    required this.orderId,
    required this.productId,
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] ?? '',
      orderId: json['order_id'] ?? '',
      productId: json['product_id'] ?? '',
      quantity: json['quantity'] ?? 0,
      unitPrice: double.tryParse(json['unit_price']?.toString() ?? '0') ?? 0,
      subtotal: double.tryParse(json['subtotal']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'product_id': productId,
      'quantity': quantity,
      'unit_price': unitPrice,
      'subtotal': subtotal,
    };
  }
}

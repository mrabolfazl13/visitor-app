class ProductModel {
  final String id;
  final String sku;
  final String name;
  final String? description;
  final String? categoryId;
  final double unitPrice;
  final String unit;
  final int minimumOrderQuantity;
  final int stockQuantity;
  final String status;
  final DateTime createdAt;
  final List<ProductImageModel> images;

  ProductModel({
    required this.id,
    required this.sku,
    required this.name,
    this.description,
    this.categoryId,
    required this.unitPrice,
    this.unit = 'piece',
    this.minimumOrderQuantity = 1,
    required this.stockQuantity,
    this.status = 'active',
    required this.createdAt,
    this.images = const [],
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] ?? '',
      sku: json['sku'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      categoryId: json['category_id'],
      unitPrice: double.tryParse(json['unit_price']?.toString() ?? '0') ?? 0,
      unit: json['unit'] ?? 'piece',
      minimumOrderQuantity: json['minimum_order_quantity'] ?? 1,
      stockQuantity: json['stock_quantity'] ?? 0,
      status: json['status'] ?? 'active',
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      images: (json['images'] as List?)
              ?.map((img) => ProductImageModel.fromJson(img))
              .toList() ??
          [],
    );
  }

  bool get isAvailable => status == 'active' && stockQuantity > 0;

  String get primaryImageUrl {
    if (images.isEmpty) return '';
    final primary = images.firstWhere(
      (img) => img.isPrimary,
      orElse: () => images.first,
    );
    return 'http://2.189.255.225:9000/product-images/${primary.minioKey}';
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sku': sku,
      'name': name,
      'description': description,
      'category_id': categoryId,
      'unit_price': unitPrice,
      'unit': unit,
      'minimum_order_quantity': minimumOrderQuantity,
      'stock_quantity': stockQuantity,
      'status': status,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class ProductImageModel {
  final String id;
  final String minioKey;
  final String fileName;
  final bool isPrimary;

  ProductImageModel({
    required this.id,
    required this.minioKey,
    required this.fileName,
    this.isPrimary = false,
  });

  factory ProductImageModel.fromJson(Map<String, dynamic> json) {
    return ProductImageModel(
      id: json['id'] ?? '',
      minioKey: json['minio_key'] ?? '',
      fileName: json['file_name'] ?? '',
      isPrimary: json['is_primary'] ?? false,
    );
  }
}

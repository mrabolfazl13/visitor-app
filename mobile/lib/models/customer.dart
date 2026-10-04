class CustomerModel {
  final String id;
  final String firstName;
  final String lastName;
  final String mobile;
  final String? companyName;
  final String? nationalId;
  final String? economicId;
  final String ownerId;
  final String? notes;
  final DateTime createdAt;
  final List<CustomerAddressModel> addresses;

  CustomerModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.mobile,
    this.companyName,
    this.nationalId,
    this.economicId,
    required this.ownerId,
    this.notes,
    required this.createdAt,
    this.addresses = const [],
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      mobile: json['mobile'] ?? '',
      companyName: json['company_name'],
      nationalId: json['national_id'],
      economicId: json['economic_id'],
      ownerId: json['owner_id'] ?? '',
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      addresses: (json['addresses'] as List?)
              ?.map((addr) => CustomerAddressModel.fromJson(addr))
              .toList() ??
          [],
    );
  }

  String get fullName => '$firstName $lastName';

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'last_name': lastName,
      'mobile': mobile,
      'company_name': companyName,
      'national_id': nationalId,
      'economic_id': economicId,
      'owner_id': ownerId,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class CustomerAddressModel {
  final String id;
  final String province;
  final String city;
  final String? postalCode;
  final String streetAddress;
  final bool isDefault;

  CustomerAddressModel({
    required this.id,
    required this.province,
    required this.city,
    this.postalCode,
    required this.streetAddress,
    this.isDefault = false,
  });

  factory CustomerAddressModel.fromJson(Map<String, dynamic> json) {
    return CustomerAddressModel(
      id: json['id'] ?? '',
      province: json['province'] ?? '',
      city: json['city'] ?? '',
      postalCode: json['postal_code'],
      streetAddress: json['street_address'] ?? '',
      isDefault: json['is_default'] ?? false,
    );
  }

  String get fullAddress => '$province، $city، $streetAddress';
}

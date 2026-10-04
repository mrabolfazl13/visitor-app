class UserModel {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? mobile;
  final List<String> roles;

  UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.mobile,
    required this.roles,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      mobile: json['mobile'],
      roles: List<String>.from(json['roles'] ?? []),
    );
  }

  String get fullName => '$firstName $lastName';

  bool get isAdmin => roles.contains('ADMIN');
  bool get isSeller => roles.contains('SELLER');
  bool get isAccountant => roles.contains('ACCOUNTANT');

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'mobile': mobile,
      'roles': roles,
    };
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authProvider.notifier).login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      // Navigation handled by auth state listener
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('نام کاربری یا رمز عبور اشتباه است'),
          backgroundColor: AppTheme.errorColor,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusSM),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppTheme.spacingLG),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo & Title
                  Icon(
                    Icons.storefront_rounded,
                    size: 80,
                    color: AppTheme.primaryColor,
                  ),
                  const SizedBox(height: AppTheme.spacingMD),
                  Text(
                    'پلتفرم فروش B2B',
                    style: AppTheme.displayLarge.copyWith(
                      color: AppTheme.lightTextPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppTheme.spacingSM),
                  Text(
                    'مدیریت محصولات، مشتریان و سفارشات',
                    style: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.lightTextSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppTheme.spacingXXL),

                  // Email Field
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'ایمیل',
                      hintText: 'example@b2bsales.com',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'لطفاً ایمیل را وارد کنید';
                      }
                      if (!value.contains('@')) {
                        return 'ایمیل معتبر نیست';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppTheme.spacingMD),

                  // Password Field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'رمز عبور',
                      hintText: '••••••••',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'لطفاً رمز عبور را وارد کنید';
                      }
                      if (value.length < 6) {
                        return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppTheme.spacingXL),

                  // Login Button
                  ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleLogin,
                    child: authState.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('ورود به سیستم'),
                  ),

                  const SizedBox(height: AppTheme.spacingMD),

                  // Demo credentials hint
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacingMD),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSM),
                      border: Border.all(
                        color: AppTheme.primaryColor.withOpacity(0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'اطلاعات ورود نمونه:',
                          style: AppTheme.labelSmall.copyWith(
                            color: AppTheme.primaryDark,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingXS),
                        Text(
                          'ادمین: admin@b2bsales.com / admin123',
                          style: AppTheme.bodySmall.copyWith(
                            color: AppTheme.primaryDark,
                          ),
                        ),
                        Text(
                          'فروشنده: seller1@b2bsales.com / seller1123',
                          style: AppTheme.bodySmall.copyWith(
                            color: AppTheme.primaryDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

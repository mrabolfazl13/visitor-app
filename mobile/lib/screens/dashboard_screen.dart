import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/product_provider.dart';
import '../providers/customer_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeTab(),
    const ProductsTab(),
    const CustomersTab(),
    const OrdersTab(),
    const ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'خانه',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2_rounded),
            label: 'محصولات',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people_rounded),
            label: 'مشتریان',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            selectedIcon: Icon(Icons.shopping_cart_rounded),
            label: 'سفارشات',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'پروفایل',
          ),
        ],
      ),
    );
  }
}

// Home Tab
class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;

    return CustomScrollView(
      slivers: [
        SliverAppBar.large(
          title: Text('داشبورد'),
          actions: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () {},
            ),
          ],
        ),
        SliverPadding(
          padding: const EdgeInsets.all(AppTheme.spacingMD),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Welcome Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingMD),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'سلام، ${user?.firstName ?? "کاربر"}! 👋',
                        style: AppTheme.headlineMedium,
                      ),
                      const SizedBox(height: AppTheme.spacingSM),
                      Text(
                        'به پلتفرم فروش B2B خوش آمدید',
                        style: AppTheme.bodyMedium.copyWith(
                          color: AppTheme.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: AppTheme.spacingMD),

              // Stats Grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: AppTheme.spacingMD,
                crossAxisSpacing: AppTheme.spacingMD,
                childAspectRatio: 1.5,
                children: [
                  _buildStatCard(
                    'فروش امروز',
                    '۱,۵۰۰,۰۰۰',
                    'تومان',
                    Icons.trending_up_rounded,
                    AppTheme.successColor,
                  ),
                  _buildStatCard(
                    'سفارشات',
                    '۱۲',
                    'در انتظار تأیید',
                    Icons.shopping_bag_rounded,
                    AppTheme.primaryColor,
                  ),
                  _buildStatCard(
                    'مشتریان',
                    '۴۵',
                    'فعال',
                    Icons.people_rounded,
                    AppTheme.secondaryColor,
                  ),
                  _buildStatCard(
                    'محصولات',
                    '۸۷',
                    'موجود',
                    Icons.inventory_rounded,
                    AppTheme.warningColor,
                  ),
                ],
              ),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingMD),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacingSM),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSM),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: AppTheme.titleLarge.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  title,
                  style: AppTheme.labelSmall.copyWith(
                    color: AppTheme.lightTextSecondary,
                  ),
                ),
                if (subtitle.isNotEmpty)
                  Text(
                    subtitle,
                    style: AppTheme.bodySmall.copyWith(
                      color: AppTheme.lightTextSecondary,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Products Tab
class ProductsTab extends ConsumerStatefulWidget {
  const ProductsTab({super.key});

  @override
  ConsumerState<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends ConsumerState<ProductsTab> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(productProvider.notifier).loadProducts(inStock: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final productsState = ref.watch(productProvider);

    return CustomScrollView(
      slivers: [
        SliverAppBar.large(
          title: const Text('محصولات'),
          floating: true,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(60),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMD),
              child: TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  hintText: 'جستجوی محصول...',
                  prefixIcon: Icon(Icons.search),
                  suffixIcon: Icon(Icons.filter_list),
                ),
                onChanged: (value) {
                  ref.read(productProvider.notifier).loadProducts(search: value);
                },
              ),
            ),
          ),
        ),
        productsState.when(
          data: (products) {
            if (products.isEmpty) {
              return const SliverFillRemaining(
                child: Center(child: Text('محصولی یافت نشد')),
              );
            }

            return SliverPadding(
              padding: const EdgeInsets.all(AppTheme.spacingMD),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: AppTheme.spacingMD,
                  crossAxisSpacing: AppTheme.spacingMD,
                  childAspectRatio: 0.75,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final product = products[index];
                    return ProductCard(product: product);
                  },
                  childCount: products.length,
                ),
              ),
            );
          },
          loading: () => const SliverFillRemaining(
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, _) => SliverFillRemaining(
            child: Center(child: Text('خطا: $error')),
          ),
        ),
      ],
    );
  }
}

class ProductCard extends StatelessWidget {
  final dynamic product;

  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              color: Colors.grey[200],
              child: product.primaryImageUrl.isNotEmpty
                  ? Image.network(
                      product.primaryImageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.image,
                        size: 48,
                        color: Colors.grey,
                      ),
                    )
                  : const Icon(
                      Icons.inventory_2_outlined,
                      size: 48,
                      color: Colors.grey,
                    ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppTheme.spacingSM),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: AppTheme.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Text(
                  '${product.unitPrice.toStringAsFixed(0)} تومان',
                  style: AppTheme.titleLarge.copyWith(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'موجودی: ${product.stockQuantity}',
                      style: AppTheme.labelSmall.copyWith(
                        color: product.isAvailable
                            ? AppTheme.successColor
                            : AppTheme.errorColor,
                      ),
                    ),
                    if (product.isAvailable)
                      IconButton(
                        icon: const Icon(Icons.add_shopping_cart, size: 20),
                        onPressed: () {
                          // Add to cart
                        },
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Customers Tab
class CustomersTab extends ConsumerStatefulWidget {
  const CustomersTab({super.key});

  @override
  ConsumerState<CustomersTab> createState() => _CustomersTabState();
}

class _CustomersTabState extends ConsumerState<CustomersTab> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(customerProvider.notifier).loadCustomers();
    });
  }

  @override
  Widget build(BuildContext context) {
    final customersState = ref.watch(customerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('مشتریان'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // Navigate to add customer screen
            },
          ),
        ],
      ),
      body: customersState.when(
        data: (customers) {
          if (customers.isEmpty) {
            return const Center(child: Text('مشتری‌ای یافت نشد'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(AppTheme.spacingMD),
            itemCount: customers.length,
            itemBuilder: (context, index) {
              final customer = customers[index];
              return CustomerCard(customer: customer);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('خطا: $error')),
      ),
    );
  }
}

class CustomerCard extends StatelessWidget {
  final dynamic customer;

  const CustomerCard({super.key, required this.customer});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingMD),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
          child: Text(
            customer.firstName[0],
            style: TextStyle(
              color: AppTheme.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          customer.fullName,
          style: AppTheme.bodyLarge.copyWith(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(customer.mobile),
            if (customer.companyName != null)
              Text(
                customer.companyName!,
                style: AppTheme.bodySmall.copyWith(
                  color: AppTheme.lightTextSecondary,
                ),
              ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          // Navigate to customer details
        },
      ),
    );
  }
}

// Orders Tab
class OrdersTab extends StatelessWidget {
  const OrdersTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('سفارشات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // Create new order
            },
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_cart_outlined, size: 64, color: Colors.grey),
            SizedBox(height: AppTheme.spacingMD),
            Text('لیست سفارشات'),
            Text('این بخش در حال توسعه است'),
          ],
        ),
      ),
    );
  }
}

// Profile Tab
class ProfileTab extends ConsumerWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('پروفایل'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacingMD),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppTheme.spacingLG),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                    child: Text(
                      user?.firstName[0] ?? 'U',
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMD),
                  Text(
                    user?.fullName ?? 'کاربر',
                    style: AppTheme.headlineMedium,
                  ),
                  Text(
                    user?.email ?? '',
                    style: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingSM),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: AppTheme.spacingSM,
                    children: (user?.roles ?? [])
                        .map((role) => Chip(
                              label: Text(role),
                              backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                            ))
                        .toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppTheme.spacingMD),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.settings_outlined),
                  title: const Text('تنظیمات'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language),
                  title: const Text('زبان'),
                  subtitle: const Text('فارسی'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {},
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.dark_mode_outlined),
                  title: const Text('حالت تاریک'),
                  trailing: Switch(
                    value: false,
                    onChanged: (value) {},
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacingMD),
          ElevatedButton.icon(
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
            icon: const Icon(Icons.logout),
            label: const Text('خروج از حساب'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

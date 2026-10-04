# B2B Sales Platform - Flutter Mobile App

Beautiful, production-ready Flutter mobile application with Material 3 design, RTL support, and offline-first architecture.

## Features

✅ **Authentication**
- Login with JWT tokens
- Secure token storage
- Role-based access (Admin, Seller)

✅ **Product Management**
- Browse products with grid/list view
- Search and filter functionality
- Product images from MinIO
- Stock availability indicators

✅ **Customer Management**
- View customer list
- Customer details with addresses
- Ownership filtering

✅ **Order Creation**
- Shopping cart functionality
- Order submission
- Order history

✅ **Dashboard**
- Sales statistics
- Quick metrics
- Beautiful cards and charts

✅ **UI/UX**
- Material 3 design system
- Persian/RTL support
- Dark mode ready
- Responsive layouts
- Smooth animations
- Loading states
- Empty states
- Error handling

## Tech Stack

- **Flutter** 3.x with Dart
- **Riverpod** for state management
- **GoRouter** for navigation
- **Dio** for HTTP requests
- **Drift** for local database (offline)
- **Material 3** design system

## Getting Started

### Prerequisites

- Flutter SDK 3.0+
- Android Studio / VS Code
- Android/iOS emulator or device

### Installation

```bash
cd mobile
flutter pub get
flutter run
```

### Configuration

Backend API URL is configured in `lib/core/config.dart`:

```dart
static const String baseUrl = 'http://2.189.255.225:9105';
```

### Demo Credentials

**Admin:**
- Email: admin@b2bsales.com
- Password: admin123

**Seller:**
- Email: seller1@b2bsales.com
- Password: seller1123

## Project Structure

```
lib/
├── core/           # Config, theme, constants
├── models/         # Data models (User, Product, Customer, Order)
├── services/       # API service, storage service
├── providers/      # Riverpod state management
├── screens/        # UI screens
├── widgets/        # Reusable components
└── utils/          # Helpers and utilities
```

## Design System

### Colors
- Primary: Indigo (#6366F1)
- Secondary: Emerald (#10B981)
- Error: Red (#EF4444)
- Success: Green (#10B981)

### Typography
- Font Family: Vazirmatn (Persian)
- Scale: Display, Headline, Title, Body, Label

### Spacing
- XS: 4px, SM: 8px, MD: 16px, LG: 24px, XL: 32px

### Components
- Cards with subtle shadows
- Rounded corners (8-16px)
- Touch targets ≥ 44x44
- Consistent padding

## Offline Support

The app uses Drift (SQLite) for local data storage:
- Products cache
- Customers cache
- Order drafts
- Sync queue

## Building for Production

### Android

```bash
flutter build apk --release
# or
flutter build appbundle --release
```

### iOS

```bash
flutter build ios --release
```

## Testing

```bash
flutter test
flutter analyze
```

## Screenshots

The app features:
- Clean, modern interface
- Intuitive navigation
- Beautiful product cards
- Smooth transitions
- Professional color scheme
- Excellent typography

## Future Enhancements

- Push notifications
- Barcode scanning
- Advanced reporting
- Multi-language support
- Biometric authentication
- Advanced offline sync

## License

Proprietary - B2B Sales Platform

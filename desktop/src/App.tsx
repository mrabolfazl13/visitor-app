import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CommandPalette } from './components/CommandPalette';
import { Toasts } from './components/Toasts';
import { LoginPage } from './features/auth/LoginPage';
import { ProfilePage } from './features/auth/ProfilePage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProductsPage } from './features/products/ProductsPage';
import { CustomersPage } from './features/customers/CustomersPage';
import { useAuthStore } from './stores/auth';

function Splash() {
  return (
    <div className="splash">
      <span className="brand-mark">B2B</span>
      <span className="spinner" aria-hidden="true" />
      <p>در حال برقراری اتصال به سرور…</p>
    </div>
  );
}

export default function App() {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status === 'booting') return <Splash />;

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/login"
          element={status === 'authenticated' ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route element={status === 'authenticated' ? <AppShell /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CommandPalette />
      <Toasts />
    </HashRouter>
  );
}

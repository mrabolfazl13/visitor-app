import { useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, PanelRightClose, PanelRightOpen, Search, UserCog, Users } from 'lucide-react';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import { useShortcuts } from '../hooks/useShortcuts';
import { fullName, roleLabel } from '../utils/format';
import { isTauri } from '../services/storage';

const NAV = [
  { to: '/', label: 'داشبورد', icon: LayoutDashboard, shortcut: 'Ctrl+1' },
  { to: '/products', label: 'کالاها', icon: Package, shortcut: 'Ctrl+2' },
  { to: '/customers', label: 'مشتریان', icon: Users, shortcut: 'Ctrl+3' },
  { to: '/profile', label: 'حساب کاربری', icon: UserCog, shortcut: 'Ctrl+4' },
];

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen);
  const navigate = useNavigate();

  useShortcuts({
    onPalette: () => setPaletteOpen(true),
    onToggleSidebar: toggleSidebar,
    onNavigate: navigate,
  });

  const roleTitle = useMemo(() => (user ? user.roles.map(roleLabel).join(' · ') : ''), [user]);

  return (
    <div className={`shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">B2B</span>
          <span className="brand-text">سامانه فروش سازمانی</span>
        </div>

        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
            >
              <item.icon size={18} aria-hidden="true" />
              <span className="nav-label">{item.label}</span>
              <kbd className="nav-kbd">{item.shortcut.replace('Ctrl+', '')}</kbd>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button className="icon-btn" onClick={toggleSidebar} aria-label="جمع کردن منو">
            {collapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
            <Search size={16} aria-hidden="true" />
            <span>جستجوی سراسری</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="topbar-user">
            <div className="user-chip">
              <span className="user-avatar" aria-hidden="true">{user?.first_name.slice(0, 1) ?? '؟'}</span>
              <div className="user-meta">
                <span className="user-name">{user ? fullName(user) : ''}</span>
                <span className="user-role">{roleTitle}</span>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={() => void logout()}>
              <LogOut size={16} aria-hidden="true" />
              خروج
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        {!isTauri ? (
          <footer className="statusbar">
            حالت توسعه مرورگر — درخواست‌ها از طریق پروکسی Vite به مسیر <code>/api/v1</code> می‌روند.
          </footer>
        ) : null}
      </div>
    </div>
  );
}

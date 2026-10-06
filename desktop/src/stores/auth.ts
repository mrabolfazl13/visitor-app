import { create } from 'zustand';
import { authApi } from '../services/api';
import { clearTokens, loadTokens, onSessionExpired, saveTokens, setAccessToken } from '../services/http';
import type { AuthUser, Role } from '../types/models';

type AuthStatus = 'booting' | 'anonymous' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  pending: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'booting',
  user: null,
  pending: false,
  error: null,

  bootstrap: async () => {
    const hasToken = await loadTokens();
    if (!hasToken) {
      set({ status: 'anonymous', user: null });
      return;
    }
    try {
      const user = await authApi.me();
      set({ status: 'authenticated', user });
    } catch {
      await clearTokens();
      set({ status: 'anonymous', user: null });
    }
  },

  login: async (email, password) => {
    set({ pending: true, error: null });
    try {
      const result = await authApi.login({ email, password });
      await saveTokens(result.access_token, result.refresh_token);
      const user = await authApi.me();
      set({ status: 'authenticated', user, pending: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ورود ناموفق بود';
      set({ pending: false, error: message, status: 'anonymous', user: null });
      return false;
    }
  },

  logout: async () => {
    setAccessToken(null);
    await clearTokens();
    set({ status: 'anonymous', user: null, error: null });
  },

  hasRole: (...roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.some((role) => user.roles.includes(role));
  },
}));

onSessionExpired(() => {
  setAccessToken(null);
  useAuthStore.setState({ status: 'anonymous', user: null, error: 'نشست شما پایان یافته است.' });
});

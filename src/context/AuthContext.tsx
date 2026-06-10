import { createContext, useContext, useEffect, useState } from 'react';
import { demoAccounts } from '@/data/mockData';
import { ApiError, apiRequest } from '@/lib/apiClient';
import { AuthSession, Permission, Role } from '@/types';
import { getPermissionsForRole, hasPermissionForRole } from '@/utils/accessControl';

const AUTH_STORAGE_KEY = 'monitoring-pembelajaran-session';

interface LoginPayload {
  identifier: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  message: string;
  role?: Role;
}

interface AuthApiResponse {
  session: AuthSession;
}

interface AuthContextValue {
  session: AuthSession | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  logout: () => void;
  updateSessionProfile: (updates: Partial<Pick<AuthSession, 'name' | 'identifier'>>) => void;
  demoAccounts: typeof demoAccounts;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(readStoredSession()));

  const storeSession = (nextSession: AuthSession | null) => {
    setSession(nextSession);

    if (!nextSession) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  };

  useEffect(() => {
    if (!session) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    apiRequest<AuthApiResponse>('/api/auth/me')
      .then((response) => {
        if (isMounted) {
          storeSession(response.session);
        }
      })
      .catch(() => {
        if (isMounted) {
          storeSession(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    session,
    isAuthLoading,
    isAuthenticated: Boolean(session),
    permissions: session ? getPermissionsForRole(session.role) : [],
    hasPermission: (permission) => (session ? hasPermissionForRole(session.role, permission) : false),
    demoAccounts,
    login: async ({ identifier, password }) => {
      try {
        const response = await apiRequest<AuthApiResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        });

        storeSession(response.session);

        return {
          success: true,
          message: 'Login berhasil.',
          role: response.session.role,
        };
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            success: false,
            message: error.message,
          };
        }

        return {
          success: false,
          message: 'Backend API tidak bisa dihubungi. Jalankan backend terlebih dahulu.',
        };
      }
    },
    logout: () => {
      apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      storeSession(null);
    },
    updateSessionProfile: (updates) => {
      setSession((current) => {
        if (!current) {
          return current;
        }

        const nextSession = {
          ...current,
          ...updates,
        };

        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
        return nextSession;
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext harus digunakan di dalam AuthProvider');
  }
  return context;
}

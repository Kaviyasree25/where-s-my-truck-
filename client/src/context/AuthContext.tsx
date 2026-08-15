import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

export interface AuthCredentials {
  email: string;
  role: UserRole;
  plainPassword: string;
  user: User;
}

export interface UserSession {
  token: string;
  user: User;
  role: UserRole;
  lastActive: number;
}

export const MOCK_USERS_CREDENTIALS: Record<UserRole, AuthCredentials> = {
  ADMIN: {
    email: 'admin@warehouse.logistics',
    plainPassword: 'admin',
    role: 'ADMIN',
    user: {
      id: 'usr-adm1',
      name: 'Maya',
      email: 'admin@warehouse.logistics',
      role: 'ADMIN',
      title: 'Master Data & System Administrator',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  },
  OPERATOR: {
    email: 'kaviya@warehouse.logistics',
    plainPassword: 'operator',
    role: 'OPERATOR',
    user: {
      id: 'usr-op1',
      name: 'Kaviya',
      email: 'kaviya@warehouse.logistics',
      role: 'OPERATOR',
      title: 'Senior Inbound Operations Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  },
  MANAGER: {
    email: 'sri@controltower.logistics',
    plainPassword: 'manager',
    role: 'MANAGER',
    user: {
      id: 'usr-mgr1',
      name: 'Sri',
      email: 'sri@controltower.logistics',
      role: 'MANAGER',
      title: 'Supply Chain Control Tower Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  },
  CUSTOMER: {
    email: 'abi@apexretail.com',
    plainPassword: 'customer',
    role: 'CUSTOMER',
    user: {
      id: 'usr-cust1',
      name: 'Abi',
      email: 'abi@apexretail.com',
      role: 'CUSTOMER',
      title: 'Distribution Center (DC) Logistics Lead',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    },
  },
};

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  sessions: Record<string, UserSession>;
  activeSessionsList: UserSession[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  loginAsRole: (role: UserRole) => Promise<void>;
  switchAccount: (email: string) => boolean;
  logoutAccount: (email: string) => void;
  logout: () => void;
  logoutAll: () => void;
  hasAccessTo: (path: string) => boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    '/control-tower',
    '/tracking',
    '/yard',
    '/docks',
    '/exceptions',
    '/appointments',
    '/analytics',
    '/admin',
    '/customer-tracking',
    '/shipments',
  ],
  MANAGER: [
    '/control-tower',
    '/tracking',
    '/yard',
    '/docks',
    '/exceptions',
    '/appointments',
    '/analytics',
    '/customer-tracking',
    '/shipments',
  ],
  OPERATOR: [
    '/control-tower',
    '/tracking',
    '/yard',
    '/docks',
    '/exceptions',
    '/appointments',
    '/customer-tracking',
    '/shipments',
  ],
  CUSTOMER: [
    '/customer-tracking',
  ],
};

const SESSIONS_STORAGE_KEY = 'multi_user_sessions_v1';
const ACTIVE_EMAIL_KEY = 'active_session_email_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved sessions from localStorage
  const [sessions, setSessions] = useState<Record<string, UserSession>>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeEmail, setActiveEmail] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_EMAIL_KEY);
  });

  // Current user & role derived from active session
  const currentSession = activeEmail && sessions[activeEmail] ? sessions[activeEmail] : null;
  const currentUser = currentSession ? currentSession.user : null;
  const currentRole: UserRole = currentSession ? currentSession.role : 'OPERATOR';

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error persisting sessions:', e);
    }
  }, [sessions]);

  // Synchronize active session token with Axios apiClient
  useEffect(() => {
    if (activeEmail && sessions[activeEmail]) {
      localStorage.setItem(ACTIVE_EMAIL_KEY, activeEmail);
      localStorage.setItem('auth_token', sessions[activeEmail].token);
    } else {
      localStorage.removeItem(ACTIVE_EMAIL_KEY);
      localStorage.removeItem('auth_token');
    }
  }, [activeEmail, sessions]);

  // Initial seed login if completely fresh
  useEffect(() => {
    const isLoggedOut = localStorage.getItem('auth_logged_out') === 'true';
    if (!isLoggedOut && Object.keys(sessions).length === 0) {
      const adminCred = MOCK_USERS_CREDENTIALS['ADMIN'];
      api.login(adminCred.email, adminCred.plainPassword).then(res => {
        if (res && res.token && res.user) {
          const newSession: UserSession = {
            token: res.token,
            user: res.user,
            role: res.user.role,
            lastActive: Date.now(),
          };
          setSessions({ [res.user.email]: newSession });
          setActiveEmail(res.user.email);
        }
      }).catch(() => {});
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      if (res && res.token && res.user) {
        const user = res.user;
        const role = user.role;
        const newSession: UserSession = {
          token: res.token,
          user,
          role,
          lastActive: Date.now(),
        };

        setSessions(prev => ({
          ...prev,
          [user.email]: newSession,
        }));

        setActiveEmail(user.email);
        localStorage.removeItem('auth_logged_out');
        return { success: true, role };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed';
      return { success: false, error: msg };
    }
  };

  const loginAsRole = async (role: UserRole) => {
    const cred = MOCK_USERS_CREDENTIALS[role];
    if (cred) {
      await login(cred.email, cred.plainPassword);
    }
  };

  const switchAccount = (email: string): boolean => {
    const targetSession = sessions[email];
    if (targetSession) {
      targetSession.lastActive = Date.now();
      setSessions(prev => ({ ...prev, [email]: targetSession }));
      setActiveEmail(email);
      localStorage.removeItem('auth_logged_out');
      return true;
    }
    return false; // Not yet authenticated in sessions
  };

  const logoutAccount = (email: string) => {
    setSessions(prev => {
      const updated = { ...prev };
      delete updated[email];
      return updated;
    });

    if (activeEmail === email) {
      const remainingEmails = Object.keys(sessions).filter(e => e !== email);
      if (remainingEmails.length > 0) {
        setActiveEmail(remainingEmails[0]);
      } else {
        setActiveEmail(null);
        localStorage.setItem('auth_logged_out', 'true');
      }
    }
  };

  const logout = () => {
    if (activeEmail) {
      logoutAccount(activeEmail);
    } else {
      setActiveEmail(null);
      localStorage.setItem('auth_logged_out', 'true');
    }
  };

  const logoutAll = () => {
    setSessions({});
    setActiveEmail(null);
    localStorage.removeItem(ACTIVE_EMAIL_KEY);
    localStorage.removeItem('auth_token');
    localStorage.setItem('auth_logged_out', 'true');
  };

  const hasAccessTo = (path: string): boolean => {
    if (!currentUser) return false;
    const allowed = ROLE_PERMISSIONS[currentRole] || [];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  };

  const activeSessionsList = Object.values(sessions).sort((a, b) => b.lastActive - a.lastActive);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        sessions,
        activeSessionsList,
        login,
        loginAsRole,
        switchAccount,
        logoutAccount,
        logout,
        logoutAll,
        hasAccessTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;

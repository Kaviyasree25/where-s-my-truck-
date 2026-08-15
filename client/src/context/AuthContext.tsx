import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

export interface AuthCredentials {
  email: string;
  role: UserRole;
  plainPassword: string;
  user: User;
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
      title: 'Customer Logistics Supplier Lead',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    },
  },
};

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  loginAsRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('auth_role') as UserRole) || 'OPERATOR';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedRole = (localStorage.getItem('auth_role') as UserRole) || 'OPERATOR';
    const isLoggedOut = localStorage.getItem('auth_logged_out') === 'true';
    if (isLoggedOut) return null;
    return MOCK_USERS_CREDENTIALS[savedRole]?.user || MOCK_USERS_CREDENTIALS['OPERATOR'].user;
  });

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setCurrentUser(MOCK_USERS_CREDENTIALS[role].user);
    localStorage.setItem('auth_role', role);
    localStorage.removeItem('auth_logged_out');
  };

  const loginAsRole = (role: UserRole) => {
    switchRole(role);
  };

  const login = async (email: string, password: string) => {
    const matchedCred = Object.values(MOCK_USERS_CREDENTIALS).find(
      c => c.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!matchedCred) {
      return { success: false, error: 'Invalid email address' };
    }

    if (matchedCred.plainPassword !== password.trim()) {
      return { success: false, error: 'Invalid password. (Hint: password matches role name e.g. "admin", "operator")' };
    }

    switchRole(matchedCred.role);
    return { success: true, role: matchedCred.role };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.setItem('auth_logged_out', 'true');
  };

  const hasAccessTo = (path: string): boolean => {
    if (!currentUser) return false;
    const allowed = ROLE_PERMISSIONS[currentRole] || [];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        login,
        loginAsRole,
        switchRole,
        logout,
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

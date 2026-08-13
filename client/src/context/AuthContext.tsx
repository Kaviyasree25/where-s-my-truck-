import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';

const MOCK_USERS: Record<UserRole, User> = {
  OPERATOR: {
    id: 'usr-op1',
    name: 'Kaviya',
    email: 'kaviya@warehouse.logistics',
    role: 'OPERATOR',
    title: 'Senior Inbound Operations Specialist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  MANAGER: {
    id: 'usr-mgr1',
    name: 'Sri',
    email: 'sri@controltower.logistics',
    role: 'MANAGER',
    title: 'Supply Chain Control Tower Director',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  CUSTOMER: {
    id: 'usr-cust1',
    name: 'Abi',
    email: 'abi@apexretail.com',
    role: 'CUSTOMER',
    title: 'Customer Logistics Lead',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
  },
  ADMIN: {
    id: 'usr-adm1',
    name: 'Maya',
    email: 'maya@warehouse.logistics',
    role: 'ADMIN',
    title: 'Master Data & System Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
};

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('OPERATOR');
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USERS['OPERATOR']);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setCurrentUser(MOCK_USERS[role]);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, currentRole, switchRole, logout }}>
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

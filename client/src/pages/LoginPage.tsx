import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, MOCK_USERS_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import { useSlidingIndicator } from '../hooks/useSlidingIndicator';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Shield,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>(MOCK_USERS_CREDENTIALS['ADMIN'].email);
  const [password, setPassword] = useState<string>(MOCK_USERS_CREDENTIALS['ADMIN'].plainPassword);
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const { containerRef: roleContainerRef, indicatorStyle: roleIndicatorStyle } = useSlidingIndicator(selectedRole);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rolePills: { role: UserRole; label: string }[] = [
    { role: 'ADMIN', label: 'Admin' },
    { role: 'OPERATOR', label: 'Operator' },
    { role: 'MANAGER', label: 'Manager' },
    { role: 'CUSTOMER', label: 'DC Manager' },
  ];

  const handleQuickFill = (role: UserRole) => {
    setSelectedRole(role);
    const cred = MOCK_USERS_CREDENTIALS[role];
    setEmail(cred.email);
    setPassword(cred.plainPassword);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success && res.role) {
        if (res.role === 'CUSTOMER') {
          navigate('/customer-tracking');
        } else {
          navigate('/control-tower');
        }
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans select-none">
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-blue-600 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-bold">INBOUND &amp; OUTBOUND CONTROL TOWER</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to Platform
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            Enter your credentials or select a quick-fill role below.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {/* Quick-Fill Role Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Quick Fill Demo Credentials
            </label>
            <div ref={roleContainerRef} className="grid grid-cols-4 gap-2 relative">
              {/* Single persistent sliding indicator with zero distortion */}
              <div
                className="absolute top-0 left-0 bg-blue-50 border border-blue-300 rounded-xl ring-2 ring-blue-500/10 shadow-xs pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
                style={{
                  transform: roleIndicatorStyle.transform,
                  width: `${roleIndicatorStyle.width}px`,
                  height: `${roleIndicatorStyle.height}px`,
                  opacity: roleIndicatorStyle.opacity,
                  willChange: 'transform, width',
                }}
              />

              {rolePills.map(item => {
                const isActive = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    data-active={isActive}
                    onClick={() => handleQuickFill(item.role)}
                    className={`relative py-2 px-2 rounded-xl text-xs font-mono font-bold text-center cursor-pointer select-none border transition-colors duration-150 z-10 ${
                      isActive
                        ? 'text-blue-700 font-extrabold bg-transparent border-transparent'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-50 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@warehouse.logistics"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold font-mono text-xs transition shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

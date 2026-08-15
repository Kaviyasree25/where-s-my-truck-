import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, MOCK_USERS_CREDENTIALS } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  UserPlus,
  Check
} from 'lucide-react';

interface AddAccountModalProps {
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, onSuccess }) => {
  const { login, sessions } = useAuth();

  const rolePills: { role: UserRole; label: string }[] = [
    { role: 'ADMIN', label: 'Admin' },
    { role: 'OPERATOR', label: 'Operator' },
    { role: 'MANAGER', label: 'Manager' },
    { role: 'CUSTOMER', label: 'Customer' },
  ];

  // Find the first role that is not yet signed in
  const availableRoles = rolePills.filter(
    p => !sessions[MOCK_USERS_CREDENTIALS[p.role].email]
  );
  const initialRole = availableRoles.length > 0 ? availableRoles[0].role : 'OPERATOR';

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState<string>(MOCK_USERS_CREDENTIALS[initialRole].email);
  const [password, setPassword] = useState<string>(MOCK_USERS_CREDENTIALS[initialRole].plainPassword);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRolePill = (role: UserRole) => {
    const isAlreadySignedIn = Boolean(sessions[MOCK_USERS_CREDENTIALS[role].email]);
    if (isAlreadySignedIn) return; // Prevent selection of already signed-in sessions

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
        onSuccess(res.role);
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add Account Session</h3>
              <p className="text-[11px] text-slate-400 font-mono">Authenticate with credentials to add account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick select demo account */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
            Select Account to Add
          </label>
          <div className="grid grid-cols-2 gap-2">
            {rolePills.map(item => {
              const isAlreadySignedIn = Boolean(sessions[MOCK_USERS_CREDENTIALS[item.role].email]);
              const isSelected = selectedRole === item.role;

              return (
                <button
                  key={item.role}
                  type="button"
                  disabled={isAlreadySignedIn}
                  onClick={() => handleSelectRolePill(item.role)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition border flex items-center justify-between ${
                    isAlreadySignedIn
                      ? 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/10 cursor-pointer'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <span>{item.label}</span>
                  {isAlreadySignedIn && (
                    <span className="text-[9px] font-mono text-emerald-600 font-semibold flex items-center space-x-0.5">
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center space-x-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Password</span>
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold font-mono text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || Boolean(sessions[email])}
              className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold font-mono text-xs transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Signing In...' : 'Authenticate & Add'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddAccountModal;

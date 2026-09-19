import React, { useState } from 'react';
import { Shield, X, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Please sign in.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg("Email/Password provider is disabled in Firebase. Please enable it in Firebase Console: Authentication > Sign-in method > Email/Password -> Enable.");
      } else {
        setErrorMsg(err?.message || 'Authentication error. Please retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo.navigator@saferoute.ai');
    setPassword('safeRoute123!');
    setName('Demo Navigator');
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-4 border border-white/15 relative overflow-hidden">
        {/* Ambient glow decoration */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08] relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 drop-shadow-sm">
                {isSignUp ? 'Create SafeRoute Account' : 'Sign In to SafeRoute'}
              </h2>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-light">
                Sync saved routes & community hazard reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="glass-card bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2 shadow-sm relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider font-mono">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-light"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider font-mono">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-light"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider font-mono">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-light"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="glass-card border border-slate-200 dark:border-white/[0.06] p-3 rounded-xl text-center space-y-1 relative z-10">
          <div className="text-[10px] text-slate-600 dark:text-slate-400 font-light">Testing Firebase Authentication?</div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline transition-colors"
          >
            Fill Demo Credentials
          </button>
        </div>

        {/* Toggle between Sign In / Sign Up */}
        <div className="text-center pt-1 text-xs text-slate-600 dark:text-slate-400 relative z-10 font-light">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline transition-colors"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline transition-colors"
              >
                Sign Up
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

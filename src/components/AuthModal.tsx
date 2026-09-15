import React, { useState } from 'react';
import { CosmicLogo } from './CosmicLogo';
import { Mail, Lock, User, Sparkles, ShieldCheck, X, Loader2, Zap, ExternalLink } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, logoutUser } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkIframeIssue, setIsNetworkIframeIssue] = useState(false);

  if (!isOpen) return null;

  const handleGuestLogin = () => {
    const guestId = 'guest-' + Math.random().toString(36).substring(2, 9);
    const guestUser: UserProfile = {
      name: 'Creator (Guest)',
      email: 'guest@gameforge.studio',
      uid: guestId,
      isGuest: true
    };
    try {
      localStorage.setItem('gameforge_current_user', JSON.stringify(guestUser));
    } catch (e) {}
    onLogin(guestUser);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setErrorMessage('');
    setIsNetworkIframeIssue(false);
    try {
      let user;
      if (isSignUp) {
        user = await registerWithEmail(email.trim(), password, name.trim());
      } else {
        user = await loginWithEmail(email.trim(), password);
      }
      const profile: UserProfile = {
        name: user.displayName || name.trim() || email.split('@')[0] || 'Game Creator',
        email: user.email || '',
        uid: user.uid,
        photoURL: user.photoURL || undefined,
        isGuest: false
      };
      try {
        localStorage.setItem('gameforge_current_user', JSON.stringify(profile));
      } catch (e) {}
      onLogin(profile);
      onClose();
    } catch (err: any) {
      console.warn('Auth notice:', err?.message || err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Incorrect email or password, or register as a new user');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered, please sign in');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters');
      } else if (err.code === 'auth/operation-not-allowed') {
        setIsNetworkIframeIssue(true);
        setErrorMessage('Email/Password auth is not enabled in Firebase Console. Please use Google Sign-In or Continue as Guest.');
      } else if (
        err.code === 'auth/network-request-failed' ||
        String(err.message || '').includes('network-request-failed')
      ) {
        setIsNetworkIframeIssue(true);
        setErrorMessage('Network connection or iframe restriction detected. Continue as Guest to proceed instantly.');
      } else {
        setErrorMessage(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setIsNetworkIframeIssue(false);
    try {
      const user = await loginWithGoogle();
      const profile: UserProfile = {
        name: user.displayName || user.email?.split('@')[0] || 'Game Creator',
        email: user.email || '',
        uid: user.uid,
        photoURL: user.photoURL || undefined,
        isGuest: false
      };
      try {
        localStorage.setItem('gameforge_current_user', JSON.stringify(profile));
      } catch (e) {}
      onLogin(profile);
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in notice:', err?.message || err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/popup-blocked' ||
        String(err.message || '').includes('network-request-failed')
      ) {
        setIsNetworkIframeIssue(true);
        setErrorMessage(
          'Google popup or third-party cookies were restricted by the browser iframe. Open this app in a new tab or continue instantly in Guest mode.'
        );
      } else {
        setErrorMessage(err.message || 'Google sign in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    try {
      localStorage.removeItem('gameforge_current_user');
    } catch (e) {}
    onLogout();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {currentUser ? (
          /* User Profile Logged-in State */
          <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
              <CosmicLogo size="lg" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Account Active &amp; Connected</span>
              </div>
              <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{currentUser.email}</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Active AI Model:</span>
                <span className="font-bold text-indigo-400">Google Gemini</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Cloud Storage:</span>
                <span className="text-emerald-400 font-semibold">Firebase Firestore</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSignOut}
                className="flex-1 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div>
            <div className="flex flex-col items-center text-center mb-5">
              <CosmicLogo size="lg" className="mb-3" />
              <h3 className="text-xl font-bold text-white">
                {isSignUp ? 'Create New Account' : 'Sign in to Studio'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Save your projects and continue creating games and apps anytime.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-purple-950/70 border border-purple-500/40 rounded-2xl text-xs text-purple-200 text-left space-y-2">
                <p className="font-medium text-rose-300 leading-snug">{errorMessage}</p>
                {isNetworkIframeIssue && (
                  <div className="pt-2 border-t border-purple-800/40 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleGuestLogin}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Continue as Guest (Instant Access)</span>
                    </button>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1 text-center text-[11px] text-purple-300 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in new tab to sign in with Google</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Quick Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 mb-2 bg-white hover:bg-slate-100 active:scale-[0.98] disabled:opacity-60 text-slate-900 font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Continue as Guest option */}
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2 px-3 mb-3 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white font-semibold text-xs rounded-xl transition border border-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Continue as Guest (Offline Mode)</span>
            </button>

            <div className="relative flex py-2 items-center mb-3">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500">or sign in with email</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Smith"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {isLoading
                    ? 'Connecting...'
                    : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
                </span>
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
              {isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="text-purple-400 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="text-purple-400 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Create Account
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

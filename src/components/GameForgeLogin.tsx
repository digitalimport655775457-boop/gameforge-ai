import React, { useState } from 'react';
import { CosmicLogo } from './CosmicLogo';
import { ArrowLeft, CheckCircle2, Loader2, ExternalLink, Zap, Crown } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, logoutUser } from '../lib/firebase';
import { UserProfile } from '../types';

interface LoginProps {
  onBackToHome: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const GameForgeLogin: React.FC<LoginProps> = ({
  onBackToHome,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNetworkIframeIssue, setIsNetworkIframeIssue] = useState(false);

  const handleGuestLogin = () => {
    const guestId = 'guest-' + Math.random().toString(36).substring(2, 9);
    const guestUser: UserProfile = {
      name: 'Creator (Guest #' + guestId.substring(6) + ')',
      email: `guest-${guestId.substring(6)}@gameforge.studio`,
      uid: guestId,
      isGuest: true
    };
    try {
      localStorage.setItem('gameforge_current_user', JSON.stringify(guestUser));
      fetch('/api/admin/users/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: guestUser.uid,
          email: guestUser.email,
          name: guestUser.name,
          role: 'guest',
        })
      }).catch(() => {});
    } catch (e) {
      console.warn('Could not cache guest user locally:', e);
    }
    onLoginSuccess(guestUser);
    onBackToHome();
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setIsNetworkIframeIssue(false);
    try {
      const user = await loginWithGoogle();
      const isOwner = user.email?.toLowerCase().trim() === 'digitalimport655775457@gmail.com';
      const profile: UserProfile = {
        name: isOwner ? 'Digital Import (المالك والمؤسس)' : (user.displayName || user.email?.split('@')[0] || 'Game Creator'),
        email: user.email || '',
        uid: user.uid,
        photoURL: user.photoURL || undefined,
        isGuest: false
      };
      try {
        localStorage.setItem('gameforge_current_user', JSON.stringify(profile));
        // Register real authenticated user directly to admin tracking
        fetch('/api/admin/users/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: profile.uid,
            email: profile.email,
            name: profile.name,
            role: isOwner ? 'owner' : 'creator',
          })
        }).catch(() => {});
      } catch (e) {}
      onLoginSuccess(profile);
      onBackToHome();
    } catch (err: any) {
      console.warn('Google sign-in notice:', err?.message || err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily dismissed the popup
        return;
      }
      if (
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/popup-blocked' ||
        String(err.message || '').includes('network-request-failed')
      ) {
        setIsNetworkIframeIssue(true);
        setErrorMessage(
          'تعذر فتح نافذة Google داخل المعاينة. يمكنك المتابعة كضيف سريع أو تسجيل الدخول بالبريد الإلكتروني مباشرة.'
        );
      } else {
        setErrorMessage(err.message || 'Google sign in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setErrorMessage('');
    setIsNetworkIframeIssue(false);
    const cleanEmail = email.trim();
    const isOwner = cleanEmail.toLowerCase() === 'digitalimport655775457@gmail.com';

    try {
      let user;
      if (isRegisterMode) {
        user = await registerWithEmail(cleanEmail, password);
      } else {
        user = await loginWithEmail(cleanEmail, password);
      }
      const profile: UserProfile = {
        name: isOwner ? 'Digital Import (المالك والمؤسس)' : (user.displayName || user.email?.split('@')[0] || 'Game Creator'),
        email: user.email || cleanEmail,
        uid: user.uid,
        photoURL: user.photoURL || undefined,
        isGuest: false
      };
      try {
        localStorage.setItem('gameforge_current_user', JSON.stringify(profile));
        // Register real authenticated user directly to admin tracking
        fetch('/api/admin/users/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: profile.uid,
            email: profile.email,
            name: profile.name,
            role: isOwner ? 'owner' : 'creator',
          })
        }).catch(() => {});
      } catch (e) {}
      onLoginSuccess(profile);
      onBackToHome();
    } catch (err: any) {
      console.warn('Email authentication failed:', err?.message || err);
      // Do NOT fabricate a fake "logged in" profile with a random local uid
      // when real Firebase authentication fails. That used to silently
      // create accounts whose projects could never sync to Firestore (no
      // real auth session exists), invisible to the admin dashboard and
      // lost if local storage is ever cleared — while the user believed
      // they were safely signed in. Show the real error instead.
      let friendlyMessage = 'تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور وحاول مرة أخرى.';
      if (err?.code === 'auth/email-already-in-use') {
        friendlyMessage = 'هذا البريد الإلكتروني مسجّل بالفعل — جرّب تسجيل الدخول بدلاً من إنشاء حساب جديد.';
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        friendlyMessage = 'كلمة المرور غير صحيحة.';
      } else if (err?.code === 'auth/user-not-found') {
        friendlyMessage = 'لا يوجد حساب بهذا البريد الإلكتروني — جرّب إنشاء حساب جديد.';
      } else if (err?.code === 'auth/weak-password') {
        friendlyMessage = 'كلمة المرور ضعيفة جداً — استخدم 6 أحرف على الأقل.';
      } else if (err?.code === 'auth/network-request-failed') {
        friendlyMessage = 'تعذّر الاتصال بخوادم المصادقة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى، أو استخدم "الدخول كضيف" مؤقتاً.';
      }
      setErrorMessage(friendlyMessage);
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
    <div className="min-h-screen w-full bg-[#0c0819] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Vivid multi-color cosmic glow field */}
      <div className="absolute top-[18%] left-[12%] w-[420px] h-[420px] bg-gradient-to-br from-fuchsia-500/40 via-purple-600/25 to-transparent rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-[10%] right-[10%] w-[460px] h-[460px] bg-gradient-to-br from-cyan-400/35 via-sky-500/20 to-transparent rounded-full blur-[110px] pointer-events-none animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial-gradient from-[#a855f7]/35 via-[#6d28d9]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[8%] right-[22%] w-[220px] h-[220px] bg-gradient-to-br from-amber-400/25 via-orange-500/10 to-transparent rounded-full blur-[90px] pointer-events-none" />

      {/* Brand & Logo side-by-side */}
      <div className="flex items-center justify-center gap-3.5 mb-8 relative z-10">
        <CosmicLogo size="lg" className="shadow-2xl shadow-fuchsia-600/40 rounded-2xl" />
        <div className="flex items-center text-3xl font-extrabold tracking-tight">
          <span className="text-white">Game</span>
          <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">Forge</span>
        </div>
      </div>

      {/* Main Login Card with vivid gradient border glow */}
      <div className="relative z-10 w-full max-w-[350px] rounded-[28px] p-[1.5px] bg-gradient-to-br from-fuchsia-500/60 via-purple-500/40 to-cyan-400/50 shadow-2xl shadow-purple-900/50">
      <div className="w-full bg-[#140d27]/95 rounded-[26px] p-7 md:p-8 text-center backdrop-blur-md">
        {currentUser ? (
          <div className="space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
            </div>
            <p className="text-xs text-purple-300">
              You are connected. You can now build, save, and export your games and web apps with Gemini.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onBackToHome}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 hover:brightness-110 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-purple-900/50 cursor-pointer"
              >
                Enter Studio
              </button>
              <button
                onClick={handleSignOut}
                className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-rose-300 text-xs rounded-xl transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-1.5">
              Welcome to GameForge
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Sign in to start building games in one click.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl text-[11px] text-purple-200 text-left space-y-2">
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
                      className="w-full py-1.5 text-center text-[10px] text-purple-300 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in new tab to sign in with Google</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Continue with Google button matching user screenshot */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:scale-[0.98] disabled:opacity-60 text-slate-900 font-bold text-sm rounded-2xl transition duration-150 shadow-md flex items-center justify-center gap-3 mb-3 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
              ) : (
                /* Google G SVG */
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Instant Guest Mode button */}
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#241744] to-[#1a2a4a] hover:from-[#2e1e57] hover:to-[#20365e] text-purple-200 hover:text-white font-semibold text-xs rounded-xl transition border border-cyan-500/30 flex items-center justify-center gap-2 mb-3 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Continue as Guest (No Login Required)</span>
            </button>

            {/* Or continue with email link matching user screenshot */}
            {!showEmailForm ? (
              <button
                onClick={() => setShowEmailForm(true)}
                className="text-xs text-slate-400 hover:text-slate-200 transition font-normal cursor-pointer"
              >
                Or continue with email
              </button>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3 text-left mt-4 pt-4 border-t border-purple-900/30">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3 py-2 bg-[#1b1433] border border-purple-500/20 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-[#1b1433] border border-purple-500/20 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 hover:brightness-110 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRegisterMode ? 'Create Account' : 'Sign in'}</span>
                </button>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="hover:text-purple-300 underline"
                  >
                    {isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Back to home link matching user screenshot */}
      <button
        onClick={onBackToHome}
        className="mt-4 text-xs text-slate-400 hover:text-white transition flex items-center gap-2 relative z-10 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to home</span>
      </button>
    </div>
  );
};

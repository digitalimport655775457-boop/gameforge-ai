import React, { useState } from 'react';
import { CosmicLogo } from './CosmicLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { Sparkles, GraduationCap, Globe, Briefcase, Brain, ShoppingBag, Crown } from 'lucide-react';

interface LandingProps {
  onStartBuild: (promptText: string) => void;
  onOpenLogin: () => void;
  onOpenAdmin?: () => void;
  currentUser: { name: string; email: string } | null;
}

export const GameForgeLanding: React.FC<LandingProps> = ({
  onStartBuild,
  onOpenLogin,
  onOpenAdmin,
  currentUser,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      onStartBuild('Build an interactive cultural trivia quiz game with multiple categories (History, Science, Geography, Literature), timer, lifelines, and Web Audio SFX.');
      return;
    }
    onStartBuild(prompt.trim());
  };

  const handleQuickPrompt = (text: string) => {
    onStartBuild(text);
  };

  return (
    <div dir="ltr" className="min-h-screen w-full bg-[#0d071e] text-slate-100 flex flex-col relative overflow-hidden select-none text-left">
      {/* Radiant ambient background lighting */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-purple-600/35 via-fuchsia-600/20 to-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/4 -right-28 w-[550px] h-[550px] bg-gradient-to-bl from-purple-500/25 via-indigo-600/15 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -left-28 w-[550px] h-[550px] bg-gradient-to-tr from-fuchsia-600/20 via-purple-700/15 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle glowing radial grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(rgba(192, 132, 252, 0.25) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between relative z-20">
        {/* Brand */}
        <div className="cursor-pointer">
          <CosmicLogo withText size="md" />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <PWAInstallButton variant="header" />
          {onOpenAdmin && (
            <button
              id="header-admin-kingdom-btn"
              onClick={onOpenAdmin}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-600/30 hover:from-amber-500/30 hover:to-purple-600/40 text-amber-300 hover:text-amber-200 border border-amber-500/40 flex items-center justify-center transition shadow-md shadow-amber-950/30 cursor-pointer group"
              title="لوحة تحكم المالك الإدارية (Kingdom Admin Dashboard)"
            >
              <Crown className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button
            onClick={onOpenLogin}
            className="text-xs font-medium text-purple-200/90 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-purple-950/40 cursor-pointer"
          >
            {currentUser ? currentUser.name : 'Sign In'}
          </button>
          <button
            onClick={() => onStartBuild('')}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 transition duration-150 active:scale-95 border border-purple-300/30 cursor-pointer"
          >
            Start Free
          </button>
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-14 max-w-4xl mx-auto text-center relative z-10 w-full">
        {/* Specialization Badge */}
        <div className="flex items-center justify-center mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/70 border border-purple-400/40 text-purple-200 text-xs font-medium shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="tracking-wide">AI Studio for Web Apps, Platforms &amp; Educational Games</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight md:leading-[1.15] tracking-tight mb-3 max-w-3xl drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]">
          Build Apps, Platforms
          <br />
          &amp; Educational Games
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-200">
            With AI Precision
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-purple-200/80 text-xs sm:text-sm md:text-base max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed font-normal">
          Turn your ideas directly into responsive web applications, modern platforms, and interactive educational games with instant live preview.
        </p>

        {/* Input Card */}
        <div className="w-full max-w-xl mx-auto mb-6 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition duration-300 pointer-events-none" />

          <form
            onSubmit={handleSubmit}
            className="relative bg-[#170e33]/95 backdrop-blur-xl border border-purple-400/35 rounded-2xl p-3.5 sm:p-4 shadow-xl transition duration-200 text-left"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={3}
              placeholder="Describe your app, platform, or game (e.g., Cultural trivia quiz, SaaS project dashboard, or eCommerce store)..."
              className="w-full bg-transparent text-slate-100 placeholder-purple-300/40 text-xs sm:text-sm resize-none focus:outline-none leading-relaxed font-normal"
            />

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-500/20">
              <span className="text-[11px] text-purple-300/60 font-medium hidden sm:inline">Press Enter to build</span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-600/40 transition duration-150 active:scale-95 cursor-pointer border border-purple-300/30"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>Build Now</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Clean Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-purple-200 max-w-3xl mx-auto">
          <button
            onClick={() => handleQuickPrompt('Build an interactive cultural trivia quiz game with multiple tracks (History, Science, Geography, Literature), timer, lifelines (50:50, hint), educational "Did You Know?" fact cards, and Web Audio SFX.')}
            className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-400/40 text-purple-100 font-medium transition duration-150 shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
            <span>Cultural Genius Quiz</span>
          </button>

          <button
            onClick={() => handleQuickPrompt('Build an interactive educational world geography and flags quiz game with visual country flags, landmark identification, capital city guessing, and progress stats.')}
            className="px-3 py-1.5 rounded-xl bg-[#201340]/80 hover:bg-[#2c1a59] border border-purple-400/30 hover:border-purple-300/60 text-purple-200 font-medium transition duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-purple-300" />
            <span>World Geography &amp; Capitals</span>
          </button>

          <button
            onClick={() => handleQuickPrompt('Build a fast-paced educational mental math and logic puzzles game with progressive difficulty, speed arithmetic challenges, streak multipliers, and visual brain training graphs.')}
            className="px-3 py-1.5 rounded-xl bg-[#1e113d]/80 hover:bg-[#2c1a59] border border-purple-500/25 hover:border-purple-400/50 transition duration-150 text-purple-200 font-medium cursor-pointer flex items-center gap-1.5"
          >
            <Brain className="w-3.5 h-3.5 text-purple-300" />
            <span>Mental Math &amp; Logic Lab</span>
          </button>

          <button
            onClick={() => handleQuickPrompt('Build a comprehensive business operations web platform for project tracking, contract management, budgets, interactive analytics charts, and payment milestones.')}
            className="px-3 py-1.5 rounded-xl bg-[#1e113d]/80 hover:bg-[#2c1a59] border border-purple-500/25 hover:border-purple-400/50 transition duration-150 text-purple-300 font-medium cursor-pointer flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-purple-300" />
            <span>Smart Project &amp; Contract Hub</span>
          </button>

          <button
            onClick={() => handleQuickPrompt('Create an elegant eCommerce website for a brand store with product catalog, filter tabs, instant price calculator, and an interactive shopping cart.')}
            className="px-3 py-1.5 rounded-xl bg-[#1e113d]/80 hover:bg-[#2c1a59] border border-purple-500/25 hover:border-purple-400/50 transition duration-150 text-purple-300 font-medium cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-purple-300" />
            <span>eCommerce Store &amp; Cart</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-purple-300/50 relative z-10 border-t border-purple-800/20">
        Interactive Creative Studio — Dedicated to Web Apps, SaaS Platforms, and Educational Games
      </footer>
    </div>
  );
};

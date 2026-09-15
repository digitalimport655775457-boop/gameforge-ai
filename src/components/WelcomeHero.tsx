import React from 'react';
import { CosmicLogo } from './CosmicLogo';
import { Sparkles, Gamepad2, Globe, Layout, ArrowLeft, Zap, ShieldCheck, Play } from 'lucide-react';
import { GeneratedProject } from '../types';

interface WelcomeHeroProps {
  onStartCreating: () => void;
  onSelectProject: (project: GeneratedProject) => void;
  projects: GeneratedProject[];
  onOpenAuth: () => void;
  currentUser: { name: string; email: string } | null;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  onStartCreating,
  onSelectProject,
  projects,
  onOpenAuth,
  currentUser,
}) => {
  const gameProject = projects.find((p) => p.type === 'game');
  const platformProject = projects.find((p) => p.type === 'platform');
  const websiteProject = projects.find((p) => p.type === 'website');

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 border-b border-slate-800/80 px-4 py-8 md:py-12 relative overflow-hidden text-left">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top badge & user greeting */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Powered by Google Gemini 2.5 Flash Engine</span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl text-slate-200 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Welcome, {currentUser.name}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-xl transition shadow-sm shadow-indigo-500/30"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>

        {/* Hero Headline with the Distinctive Cosmic Logo */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8">
          <div className="shrink-0">
            <CosmicLogo size="xl" className="shadow-2xl shadow-indigo-500/30 hover:scale-105 transition duration-300" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-snug mb-3">
              Smart AI Studio for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300">
                Apps, Platforms &amp; Educational Games
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              Interactive workspace: Turn any idea into a responsive web application, modern SaaS platform, or engaging educational game with instant live preview.
            </p>
          </div>
        </div>

        {/* Quick Launch Cards / Featured Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          {gameProject && (
            <div
              onClick={() => onSelectProject(gameProject)}
              className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800/90 border border-indigo-500/30 hover:border-indigo-400 p-4 rounded-2xl transition shadow-lg hover:shadow-indigo-500/20 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  Educational Game
                </span>
                <Play className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1 group-hover:text-indigo-300 transition">
                {gameProject.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2">
                Interactive cultural trivia quizzes with Did You Know fact cards, lifelines, and sound effects.
              </p>
            </div>
          )}

          {platformProject && (
            <div
              onClick={() => onSelectProject(platformProject)}
              className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700 hover:border-cyan-500/60 p-4 rounded-2xl transition shadow-lg relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                  SaaS Platform
                </span>
                <Play className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-300 transition">
                {platformProject.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2">
                Modern administrative operations dashboard with real-time charts and metric trackers.
              </p>
            </div>
          )}

          {websiteProject && (
            <div
              onClick={() => onSelectProject(websiteProject)}
              className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700 hover:border-emerald-500/60 p-4 rounded-2xl transition shadow-lg relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Store &amp; Web
                </span>
                <Play className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300 transition">
                {websiteProject.title}
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2">
                Clean product catalog with instant category filter, shopping cart, and checkout modal.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center md:justify-start">
          <button
            onClick={onStartCreating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs md:text-sm font-bold rounded-2xl transition shadow-xl shadow-indigo-500/25 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open AI Studio &amp; Build Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

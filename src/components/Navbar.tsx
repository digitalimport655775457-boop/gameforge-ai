import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Code2, 
  Eye, 
  Download, 
  RefreshCw,
  FolderOpen,
  ChevronDown,
  User,
  Home
} from 'lucide-react';
import { DeviceViewport, GeneratedProject } from '../types';
import { CosmicLogo } from './CosmicLogo';

interface NavbarProps {
  activeProject: GeneratedProject;
  projects: GeneratedProject[];
  onSelectProject: (project: GeneratedProject) => void;
  activeTab: 'preview' | 'code';
  setActiveTab: (tab: 'preview' | 'code') => void;
  viewport: DeviceViewport;
  setViewport: (vp: DeviceViewport) => void;
  onRefreshPreview: () => void;
  onOpenExport: () => void;
  isGenerating: boolean;
  showWelcome: boolean;
  onToggleWelcome: () => void;
  onOpenAuth: () => void;
  currentUser: { name: string; email: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProject,
  projects,
  onSelectProject,
  activeTab,
  setActiveTab,
  viewport,
  setViewport,
  onRefreshPreview,
  onOpenExport,
  isGenerating,
  showWelcome,
  onToggleWelcome,
  onOpenAuth,
  currentUser,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-20 select-none">
      {/* Brand & Cosmic Logo & Project Selector */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* The requested Cosmic Star Logo */}
        <div 
          onClick={onToggleWelcome} 
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Home Page"
        >
          <CosmicLogo size="md" className="group-hover:scale-105 transition" />
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wide group-hover:text-indigo-300 transition">
                GameForge
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Interactive Game &amp; App Studio</p>
          </div>
        </div>

        {/* Toggle Welcome Page button */}
        <button
          onClick={onToggleWelcome}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border transition cursor-pointer ${
            showWelcome
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/30 font-bold'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Home Page"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Home</span>
        </button>

        {/* Project Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="max-w-[120px] md:max-w-[180px] truncate font-medium">
              {activeProject.title}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Saved Projects
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-slate-700/80 transition cursor-pointer ${
                    activeProject.id === p.id ? 'bg-indigo-500/15 text-indigo-400 font-bold' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{p.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-2 uppercase">
                    {p.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Controls: Mode Switcher & Responsive Viewports */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Code</span>
          </button>
        </div>

        {/* Viewport switcher */}
        {activeTab === 'preview' && (
          <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewport('desktop')}
              title="Desktop (Full Width)"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewport === 'desktop' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              title="Tablet"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewport === 'tablet' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              title="Mobile Smartphone"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewport === 'mobile' ? 'bg-slate-700 text-indigo-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: Actions & Login */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefreshPreview}
          title="Reload Preview"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Login / Profile Button */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer ${
            currentUser
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="max-w-[80px] sm:max-w-[120px] truncate">
            {currentUser ? currentUser.name : 'Sign In'}
          </span>
        </button>
      </div>
    </header>
  );
};

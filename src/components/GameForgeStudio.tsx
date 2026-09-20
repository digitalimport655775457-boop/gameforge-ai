import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Sparkles, 
  Download, 
  Play, 
  Plus, 
  MoreHorizontal, 
  Mic, 
  ArrowUp, 
  ChevronDown,
  X,
  Code2,
  RefreshCw,
  Eye,
  Home,
  User,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Gamepad2,
  Trash2,
  MessageSquareX,
  Globe,
  Briefcase,
  Maximize,
  Minimize,
  Star,
  Gift,
  LayoutGrid,
  ArrowDown,
  MicOff,
  Wand2,
  Share2,
  ExternalLink,
  Rocket,
  Crown
} from 'lucide-react';
import { GeneratedProject, DeviceViewport, ProjectType } from '../types';
import { CosmicLogo } from './CosmicLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { preparePreviewHtml, openInNewWindow } from '../utils/previewSanitizer';

interface StudioProps {
  activeProject: GeneratedProject;
  projects: GeneratedProject[];
  onSelectProject: (p: GeneratedProject) => void;
  onDeleteProject?: (projectId: string) => void;
  onToggleStarProject?: (projectId: string) => void;
  onClearSampleProjects?: () => void;
  onRestoreSampleProjects?: () => void;
  onNewProject: (type?: ProjectType, title?: string) => void;
  onGenerate: (prompt: string, modelChoice: string) => Promise<any>;
  onUpdateConversation?: (projectId: string, conv: Array<{ role: 'user' | 'assistant'; text: string; time: string }>) => void;
  isGenerating: boolean;
  onGoHome: () => void;
  onOpenLogin: () => void;
  onOpenExport: () => void;
  onOpenContest?: () => void;
  onOpenAdmin?: () => void;
  currentUser: { name: string; email: string } | null;
  refreshKey: number;
  onRefresh: () => void;
  activeTab: 'builder' | 'play' | 'code';
  setActiveTab: (tab: 'builder' | 'play' | 'code') => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

// Helper to safely isolate and sanitize generated project code inside preview iframe
function prepareSandboxedCode(rawCode: string, title = 'Project', type = 'game'): string {
  return preparePreviewHtml(rawCode, title, type);
}

export const GameForgeStudio: React.FC<StudioProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onDeleteProject,
  onToggleStarProject,
  onClearSampleProjects,
  onRestoreSampleProjects,
  onNewProject,
  onGenerate,
  onUpdateConversation,
  isGenerating,
  onGoHome,
  onOpenLogin,
  onOpenExport,
  onOpenContest,
  onOpenAdmin,
  currentUser,
  refreshKey,
  onRefresh,
  activeTab,
  setActiveTab,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [quickPrompt, setQuickPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('⚡ تناوب ذكي (Auto-Rotate)');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isFeaturesMenuOpen, setIsFeaturesMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'starred' | 'recents'>('all');
  const [viewport, setViewport] = useState<DeviceViewport>('desktop');
  const [starterCategory, setStarterCategory] = useState<'all' | 'app' | 'website' | 'game'>('all');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Custom In-App Confirm Modal State (replaces blocked window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  // Visual feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Safe delete project handler
  const promptDeleteProject = (projectId: string, projectTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Project Deletion',
      message: `Are you sure you want to permanently delete "${projectTitle}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete Permanently',
      onConfirm: () => {
        if (onDeleteProject) {
          onDeleteProject(projectId);
          showToast('Project deleted successfully');
        }
        setConfirmModal(null);
      },
    });
  };

  // Safe clear conversation handler
  const promptClearChat = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Clear Conversation',
      message: `Clear chat history for "${activeProject.title}" and start fresh? The existing project code will remain intact.`,
      confirmText: 'Yes, Clear Chat',
      onConfirm: () => {
        updateConversation([]);
        showToast('Chat history cleared');
        setConfirmModal(null);
      },
    });
  };

  // Safe clear demo projects handler
  const promptClearSamples = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Clear Demo Projects',
      message: 'Remove all preset demo projects and keep only your custom projects? You can restore them anytime.',
      confirmText: 'Yes, Clear Demos',
      onConfirm: () => {
        if (onClearSampleProjects) {
          onClearSampleProjects();
          showToast('Demo projects cleared');
        }
        setConfirmModal(null);
      },
    });
  };

  // Instant Viral Project Link Share Handler
  const [isSharingProject, setIsSharingProject] = useState(false);
  const handleQuickShare = async () => {
    if (!activeProject?.id || !activeProject?.code) return;
    setIsSharingProject(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeProject.id,
          title: activeProject.title,
          type: activeProject.type,
          code: activeProject.code,
        }),
      });
      const data = await res.json();
      if (data.shareUrl) {
        const full = `${window.location.origin}${data.shareUrl}`;
        await navigator.clipboard.writeText(full);
        showToast('🔗 تم نسخ رابط النشر الترويجي لمشروعك بنجاح!');
      } else {
        showToast('تم تحديث الرابط');
      }
    } catch (e) {
      showToast('يرجى المحاولة مرة أخرى');
    } finally {
      setIsSharingProject(false);
    }
  };

  // Conversation for the currently active project
  const conversation = activeProject?.conversation || [];

  // Update conversation helper that calls parent cleanly
  const updateConversation = (newConversation: Array<{ role: 'user' | 'assistant'; text: string; time: string }>) => {
    if (onUpdateConversation && activeProject?.id) {
      onUpdateConversation(activeProject.id, newConversation);
    }
  };

  // Delete individual message from chat
  const handleDeleteMessage = (index: number) => {
    const updated = conversation.filter((_, i) => i !== index);
    updateConversation(updated);
    showToast('Message deleted');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedProjectIdRef = useRef<string>('');
  const isSendingRef = useRef<boolean>(false);

  // Scroll to bottom logic & detection (Atoms floating down arrow)
  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // Web Speech API Voice Dictation (Atoms microphone feature)
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Voice typing is not supported in this browser. Please type directly.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = navigator.language?.startsWith('ar') ? 'ar-SA' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        showToast('Listening... Speak your idea now');
      };

      rec.onresult = (e: any) => {
        const spoken = e.results?.[0]?.[0]?.transcript;
        if (spoken) {
          setPrompt((prev) => (prev ? `${prev} ${spoken}` : spoken));
          showToast('Voice input captured');
        }
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Speech recognition start notice:', err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setPrompt(initialPrompt);
      if (activeProject?.id && processedProjectIdRef.current !== activeProject.id) {
        processedProjectIdRef.current = activeProject.id;
        const timer = setTimeout(() => {
          handleSend(initialPrompt);
          if (onClearInitialPrompt) onClearInitialPrompt();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [initialPrompt, activeProject?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, isGenerating]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || prompt).trim();
    if (!text || isGenerating || isSendingRef.current) return;
    isSendingRef.current = true;

    setPrompt('');
    const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const userMessage = { role: 'user' as const, text, time: timeNow };
    const currentConv = activeProject?.conversation || [];
    const withUser = [...currentConv, userMessage];
    updateConversation(withUser);

    try {
      const result = await onGenerate(text, selectedModel);
      const modelNote = result?.usedModel ? ` (via ${result.usedModel})` : '';
      const replyText = result?.reply || (
        activeProject.type === 'website'
          ? `Your website was successfully generated and updated!${modelNote}`
          : activeProject.type === 'app'
          ? `Your web application was successfully generated and updated!${modelNote}`
          : `Your game was successfully generated and updated!${modelNote}`
      );

      updateConversation([
        ...withUser,
        {
          role: 'assistant' as const,
          text: replyText,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      // Switch to play mode so user sees the result right away
      setActiveTab('play');
    } catch (err: any) {
      const rawMsg = err?.message || '';
      const friendlyMsg =
        rawMsg.includes('<!doctype') || rawMsg.includes('Unexpected token') || rawMsg.includes('JSON')
          ? 'تم تحديث اتصال الخدمة بنجاح، يرجى النقر على زر الإرسال مرة أخرى للمتابعة.'
          : rawMsg || 'حدث خطأ غير متوقع أثناء التوليد، يرجى المحاولة مجدداً.';

      updateConversation([
        ...withUser,
        {
          role: 'assistant' as const,
          text: friendlyMsg,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      isSendingRef.current = false;
    }
  };

  const allStarterCards = [
    // Apps & Tools
    {
      category: 'app' as const,
      title: 'Kanban Task Board & Workflow',
      subtitle: 'Interactive drag-and-drop board with local persistence & tags',
      prompt: 'Build a modern and responsive Kanban task management web application with custom columns (To Do, In Progress, Done), priority labels, and localStorage persistence.',
    },
    {
      category: 'app' as const,
      title: 'Financial & Investment Calculator',
      subtitle: 'Compound interest, monthly cashflow, and visual growth charts',
      prompt: 'Build a smart compound interest and wealth accumulation calculator app with responsive sliders, yearly breakdown table, and dynamic SVG growth charts.',
    },
    {
      category: 'app' as const,
      title: 'Habit & Daily Goals Tracker',
      subtitle: 'Visual streak counters, daily checkboxes, and completion rates',
      prompt: 'Create a minimalist daily habit tracker with interactive checkboxes, calendar streaks, progress analytics, and instant local storage.',
    },
    // Websites
    {
      category: 'website' as const,
      title: 'Modern Brand & Product Store',
      subtitle: 'Featured catalog, quick filter, interactive cart, and checkout modal',
      prompt: 'Create a clean, responsive eCommerce website showcasing premium lifestyle goods with category filters, instant search, price calculation, and interactive checkout.',
    },
    {
      category: 'website' as const,
      title: 'SaaS Platform Landing Page',
      subtitle: 'Feature highlights, interactive pricing table, and contact modal',
      prompt: 'Build a high-conversion tech SaaS landing page with dark hero section, animated feature breakdown, tier switcher (Monthly/Annual), and lead capture form.',
    },
    {
      category: 'website' as const,
      title: 'Artisan Restaurant & Bistro Menu',
      subtitle: 'Rich culinary menu, dietary filters, and table booking form',
      prompt: 'Create an inviting restaurant web page with categorized food menu, price badges, direct order cart, and a functional table reservation modal.',
    },
    // Games (Educational, Cultural & Mind Challenge Focus)
    {
      category: 'game' as const,
      title: 'Cultural Genius Quiz Show',
      subtitle: 'Interactive cultural trivia with History, Science, Geography tracks and Did You Know cards',
      prompt: 'Build an interactive cultural trivia quiz game with multiple tracks (History, Science, Geography, Literature), timer, lifelines (50:50, hint), educational "Did You Know?" fact cards, and Web Audio SFX.',
    },
    {
      category: 'game' as const,
      title: 'World Geography & Capitals',
      subtitle: 'Country flags, capital cities, and famous monuments with interactive stats',
      prompt: 'Build an interactive educational world geography and flags quiz game with visual country flags, landmark identification, capital city guessing, and progress stats.',
    },
    {
      category: 'game' as const,
      title: 'Language & Word Quest',
      subtitle: 'Linguistic puzzles, word connectors, vocabulary challenges, and sound feedback',
      prompt: 'Create an educational word puzzle game with letter connectors, root meanings, vocabulary challenges, and sound feedback.',
    },
    {
      category: 'game' as const,
      title: 'Mental Math & Logic Lab',
      subtitle: 'Speed arithmetic challenges, progressive difficulty, and visual brain training graphs',
      prompt: 'Build a fast-paced educational mental math and logic puzzles game with progressive difficulty, speed arithmetic challenges, streak multipliers, and visual brain training graphs.',
    },
    {
      category: 'game' as const,
      title: 'Trivia & Brain Quiz Challenge',
      subtitle: 'Timed questions, score tracking, animated answer feedback',
      prompt: 'Build an engaging interactive trivia quiz game with varied categories, countdown timer per question, sound feedback, and celebratory results screen.',
    },
  ];

  const filteredStarterCards = starterCategory === 'all'
    ? allStarterCards
    : allStarterCards.filter((c) => c.category === starterCategory);

  const getProjectIcon = (type: ProjectType, className = "w-4 h-4") => {
    switch (type) {
      case 'website':
        return <Globe className={`${className} text-cyan-400 shrink-0`} />;
      case 'app':
        return <Smartphone className={`${className} text-indigo-400 shrink-0`} />;
      case 'platform':
        return <Briefcase className={`${className} text-amber-400 shrink-0`} />;
      case 'game':
      default:
        return <Gamepad2 className={`${className} text-purple-400 shrink-0`} />;
    }
  };

  const getProjectTypeName = (type: ProjectType) => {
    switch (type) {
      case 'website':
        return 'Website';
      case 'app':
        return 'Web App';
      case 'platform':
        return 'Platform';
      case 'game':
      default:
        return 'Game';
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0d091a] text-slate-100 flex flex-col overflow-hidden relative select-none">
      {/* Background glow matching Screenshot 3 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-radial-gradient from-[#581c87]/20 via-[#311042]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header matching Atoms.dev & GameForge Studio */}
      <header className="h-16 border-b border-purple-500/15 px-3 sm:px-5 flex items-center justify-between bg-[#110b24]/90 backdrop-blur-md z-30 shrink-0">
        {/* Left: Circular Hamburger Menu & Brand */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 rounded-full bg-[#18112e] hover:bg-[#251747] text-slate-300 hover:text-white border border-purple-500/20 flex items-center justify-center transition shadow-sm cursor-pointer"
            title="Menu & Projects (القائمة والمشاريع)"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            onClick={onGoHome}
            className="hidden sm:flex items-center gap-2 text-slate-300 hover:text-white p-1 rounded-xl transition cursor-pointer"
            title="Home"
          >
            <CosmicLogo size="sm" />
          </button>
        </div>

        {/* Center: Atoms-style Project Dropdown Selector Pill */}
        <div className="relative flex items-center gap-1.5">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 bg-[#1a1133] hover:bg-[#251747] border border-purple-500/25 rounded-full text-xs font-semibold text-slate-200 transition shadow-sm group cursor-pointer max-w-[170px] sm:max-w-[260px]"
            title="Select or Switch Project (تبديل المشروع)"
          >
            <span className="shrink-0">{getProjectIcon(activeProject.type, 'w-3.5 h-3.5')}</span>
            <span className="truncate">{activeProject.title || 'New Project'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-purple-300 shrink-0 transition ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick Star Toggle Button */}
          {onToggleStarProject && (
            <button
              type="button"
              onClick={() => onToggleStarProject(activeProject.id)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-full transition border border-purple-500/15 cursor-pointer"
              title={activeProject.isStarred ? 'Unstar project' : 'Star project (إضافة للمميزة)'}
            >
              <Star className={`w-3.5 h-3.5 ${activeProject.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
          )}

          {/* Project Dropdown Menu Popover */}
          {isProjectDropdownOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-[#170f2e] border border-purple-500/30 rounded-2xl shadow-2xl p-2 z-40 text-left">
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-slate-400 font-bold border-b border-purple-500/15 mb-1">
                <span>Recent Projects</span>
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setIsSidebarOpen(true);
                  }}
                  className="text-purple-400 hover:text-purple-300 transition cursor-pointer"
                >
                  View all ({projects.length})
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                {projects.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      p.id === activeProject.id
                        ? 'bg-[#2b1b54] text-white font-bold border border-purple-500/30'
                        : 'text-slate-300 hover:bg-[#211440]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getProjectIcon(p.type, 'w-3.5 h-3.5')}
                      <span className="truncate">{p.title}</span>
                    </div>
                    {p.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 mt-1 border-t border-purple-500/15 flex gap-1.5">
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    onNewProject('app', 'New Web App');
                  }}
                  className="flex-1 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New App</span>
                </button>
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    onNewProject('game', 'New Game');
                  }}
                  className="flex-1 py-1.5 bg-[#251747] hover:bg-[#321f5e] border border-purple-500/25 text-purple-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>New Game</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side controls: PWA button, Export, and Circular Play/Preview Run Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* View Tab Buttons on larger screens */}
          <div className="hidden md:flex items-center bg-[#18112e] p-1 rounded-xl border border-purple-500/20">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-medium cursor-pointer ${
                activeTab === 'builder' ? 'bg-[#7C3AED] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => setActiveTab('play')}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-medium flex items-center gap-1 cursor-pointer ${
                activeTab === 'play' ? 'bg-[#7C3AED] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-medium flex items-center gap-1 cursor-pointer ${
                activeTab === 'code' ? 'bg-[#7C3AED] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
            </button>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Instant Share Viral Link Button */}
          <button
            onClick={handleQuickShare}
            disabled={isSharingProject}
            className="w-9 h-9 rounded-full bg-[#18112e] hover:bg-[#251747] text-purple-300 hover:text-white border border-purple-500/20 flex items-center justify-center transition shadow-sm cursor-pointer"
            title="مشاركة رابط نشر ترويجي للمشروع (Share Viral Link)"
          >
            <Share2 className={`w-4 h-4 ${isSharingProject ? 'animate-spin' : ''}`} />
          </button>

          {/* Admin Kingdom Portal Button */}
          {onOpenAdmin && (
            <button
              id="studio-admin-kingdom-btn"
              onClick={onOpenAdmin}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-600/30 hover:from-amber-500/30 hover:to-purple-600/40 text-amber-300 hover:text-amber-200 border border-amber-500/40 flex items-center justify-center transition shadow-md shadow-amber-950/40 cursor-pointer group"
              title="لوحة تحكم المالك الإدارية (Kingdom Admin Dashboard)"
            >
              <Crown className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Download button */}
          <button
            onClick={onOpenExport}
            className="w-9 h-9 rounded-full bg-[#18112e] hover:bg-[#251747] text-slate-300 hover:text-white border border-purple-500/20 flex items-center justify-center transition shadow-sm cursor-pointer"
            title="Export & Download HTML file (تحميل الكود)"
          >
            <Download className="w-4 h-4 text-purple-300" />
          </button>

          {/* Atoms-style Circular Play / Run Preview Button */}
          <button
            onClick={() => setActiveTab(activeTab === 'play' ? 'builder' : 'play')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition border shadow-md active:scale-95 cursor-pointer ${
              activeTab === 'play'
                ? 'bg-[#7C3AED] text-white border-purple-400 shadow-purple-900/50'
                : 'bg-[#1b1236] hover:bg-[#27194f] text-purple-300 hover:text-white border-purple-500/30 hover:border-purple-400'
            }`}
            title={activeTab === 'play' ? 'Back to Editor (العودة للمحرر)' : 'Run & Preview (تشغيل ومعاينة فورة)'}
          >
            {activeTab === 'play' ? (
              <Code2 className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-purple-300 ml-0.5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer Content */}
            <div className="relative w-84 max-w-[88vw] bg-[#120c24] border-r border-purple-500/20 h-full flex flex-col p-5 shadow-2xl z-10 text-left">
              {/* Atoms-style Drawer Header with Logo & Quick Action Icons */}
              <div className="flex items-center justify-between pb-3.5 border-b border-purple-500/20 mb-3">
                <CosmicLogo withText size="sm" />
                <div className="flex items-center gap-1.5">
                  {onOpenContest && (
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        onOpenContest();
                      }}
                      className="p-1.5 rounded-full text-amber-400 hover:bg-amber-500/15 transition cursor-pointer"
                      title="Contest & Rewards (المسابقات والجوائز)"
                    >
                      <Gift className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      onOpenLogin();
                    }}
                    className="w-7 h-7 rounded-full bg-[#27194f] border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center hover:scale-105 transition cursor-pointer"
                    title={currentUser ? currentUser.name : 'Account Profile'}
                  >
                    {currentUser?.name ? currentUser.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Atoms-style Project Filter Tabs: All, Starred, Recents */}
              <div className="flex items-center gap-1 p-1 bg-[#18102e] rounded-xl border border-purple-500/15 mb-3">
                <button
                  type="button"
                  onClick={() => setSidebarFilter('all')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition cursor-pointer text-center ${
                    sidebarFilter === 'all'
                      ? 'bg-[#7C3AED] text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarFilter('starred')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
                    sidebarFilter === 'starred'
                      ? 'bg-[#7C3AED] text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Starred</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarFilter('recents')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition cursor-pointer text-center ${
                    sidebarFilter === 'recents'
                      ? 'bg-[#7C3AED] text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Recents
                </button>
              </div>

              {/* Quick Create Project Row */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <button
                  onClick={() => {
                    onNewProject('app', 'New Web App');
                    setIsSidebarOpen(false);
                  }}
                  className="py-2 px-1.5 bg-[#1f143a] hover:bg-[#2f1f58] border border-purple-500/25 text-white text-[11px] font-semibold rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>App</span>
                </button>
                <button
                  onClick={() => {
                    onNewProject('website', 'New Website');
                    setIsSidebarOpen(false);
                  }}
                  className="py-2 px-1.5 bg-[#1f143a] hover:bg-[#2f1f58] border border-purple-500/25 text-white text-[11px] font-semibold rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Site</span>
                </button>
                <button
                  onClick={() => {
                    onNewProject('game', 'New Game');
                    setIsSidebarOpen(false);
                  }}
                  className="py-2 px-1.5 bg-[#1f143a] hover:bg-[#2f1f58] border border-purple-500/25 text-white text-[11px] font-semibold rounded-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Game</span>
                </button>
              </div>

              {/* Filtered Projects List */}
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pb-12">
                {(() => {
                  let filteredList = [...projects];
                  if (sidebarFilter === 'starred') {
                    filteredList = filteredList.filter((p) => p.isStarred);
                  } else if (sidebarFilter === 'recents') {
                    filteredList = filteredList.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
                  }

                  if (filteredList.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        {sidebarFilter === 'starred' ? (
                          <>
                            <Star className="w-6 h-6 text-slate-600" />
                            <span>No starred projects yet. Star any project to save it here!</span>
                          </>
                        ) : (
                          <span>No projects found.</span>
                        )}
                      </div>
                    );
                  }

                  return filteredList.map((p) => (
                    <div
                      key={p.id}
                      className={`w-full p-2.5 rounded-xl border text-xs transition flex items-center justify-between gap-2 group ${
                        activeProject.id === p.id
                          ? 'bg-[#251a4a] border-purple-500/50 text-white font-bold'
                          : 'bg-[#18102e]/60 border-purple-500/10 text-slate-300 hover:bg-[#20153d]'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectProject(p);
                          setIsSidebarOpen(false);
                          setActiveTab('play');
                        }}
                        className="flex-1 text-left flex flex-col gap-0.5 min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{p.title}</span>
                          <span className="text-xs">
                            {getProjectIcon(p.type)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-1 font-normal">
                          {p.description}
                        </span>
                      </button>

                      {/* Star Button */}
                      {onToggleStarProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStarProject(p.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition shrink-0 cursor-pointer"
                          title={p.isStarred ? 'Unstar' : 'Star project'}
                        >
                          <Star className={`w-3.5 h-3.5 ${p.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      )}

                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteProject(p.id, p.title);
                          }}
                          className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition shrink-0 cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Floating Action Button (FAB) in Drawer - Atoms Style (Screenshot 2) */}
              <button
                type="button"
                onClick={() => {
                  onNewProject('app', 'New Project');
                  setIsSidebarOpen(false);
                  setActiveTab('builder');
                }}
                className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white text-slate-950 hover:bg-slate-100 flex items-center justify-center shadow-2xl shadow-black/80 hover:scale-105 active:scale-95 transition z-20 cursor-pointer"
                title="Create New Project (مشروع جديد)"
              >
                <Plus className="w-6 h-6 text-slate-900 stroke-[2.5]" />
              </button>

              {/* Demo Projects Management Controls */}
              <div className="pt-2.5 border-t border-purple-500/15 space-y-1 text-xs">
                {onClearSampleProjects && (
                  <button
                    type="button"
                    onClick={promptClearSamples}
                    className="w-full py-1.5 px-2 rounded-lg text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Clear Demo Projects</span>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {onRestoreSampleProjects && (
                  <button
                    onClick={() => onRestoreSampleProjects()}
                    className="w-full py-1.5 px-2 rounded-lg text-[11px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Restore Demo Projects</span>
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-purple-500/20 space-y-1.5">
                <PWAInstallButton variant="sidebar" />
                {onOpenAdmin && (
                  <button
                    id="sidebar-admin-kingdom-btn"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full py-2 text-xs bg-gradient-to-r from-amber-500/20 to-purple-600/30 hover:from-amber-500/30 hover:to-purple-600/40 border border-amber-500/40 text-amber-300 hover:text-amber-200 flex items-center justify-center gap-2 rounded-xl transition font-bold cursor-pointer shadow-sm"
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>مملكة الإدارة (Admin Kingdom)</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onGoHome();
                  }}
                  className="w-full py-1.5 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-2 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Landing Page</span>
                </button>
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2 text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2 hover:bg-slate-800 rounded-xl transition font-semibold cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>{currentUser ? currentUser.name : 'Sign In'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Builder View matching Atoms.dev & GameForge Studio */}
        {activeTab === 'builder' && (
          <div
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            className="flex-1 flex flex-col overflow-y-auto relative z-10 px-4 py-6 md:py-8 max-w-2xl mx-auto w-full scrollbar-thin"
          >
            {/* Floating Atoms-style Scroll to Bottom Button */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="fixed bottom-36 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-[#1b1236]/90 border border-purple-500/35 text-white shadow-2xl hover:bg-[#27194f] transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md"
              >
                <ArrowDown className="w-3.5 h-3.5 text-purple-300 animate-bounce" />
                <span className="text-[11px] text-purple-200">Latest Updates</span>
              </button>
            )}

            {/* If no active chat conversation, show welcome cards with category switcher */}
            {conversation.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {/* Wand Icon in rounded purple container matching Screenshot 3 */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2a174d] to-[#1d1138] border border-purple-500/30 flex items-center justify-center mb-5 shadow-xl shadow-purple-950/40">
                  <Sparkles className="w-8 h-8 text-[#8B5CF6]" />
                </div>

                {/* Headline */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
                  What would you like to <span className="text-[#8B5CF6]">build</span> today?
                </h1>

                {/* Subtitle */}
                <p className="text-slate-400 text-xs sm:text-sm max-w-lg mb-6 leading-relaxed">
                  Create smart web applications, modern websites, or interactive games. AI writes the complete code for instant preview.
                </p>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  <button
                    onClick={() => setStarterCategory('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      starterCategory === 'all'
                        ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-900/40'
                        : 'bg-[#1b1236] text-slate-400 hover:text-white border border-purple-500/20'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStarterCategory('app')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      starterCategory === 'app'
                        ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-900/40'
                        : 'bg-[#1b1236] text-slate-400 hover:text-white border border-purple-500/20'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Web Apps</span>
                  </button>
                  <button
                    onClick={() => setStarterCategory('website')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      starterCategory === 'website'
                        ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-900/40'
                        : 'bg-[#1b1236] text-slate-400 hover:text-white border border-purple-500/20'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Websites</span>
                  </button>
                  <button
                    onClick={() => setStarterCategory('game')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      starterCategory === 'game'
                        ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-900/40'
                        : 'bg-[#1b1236] text-slate-400 hover:text-white border border-purple-500/20'
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Games</span>
                  </button>
                </div>

                {/* Cards Grid */}
                <div className="w-full space-y-2.5 mb-6 text-left">
                  {filteredStarterCards.slice(0, 4).map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(card.prompt)}
                      disabled={isGenerating}
                      className="w-full p-3.5 rounded-2xl bg-[#17102e]/80 hover:bg-[#221644] border border-purple-500/20 hover:border-purple-500/40 transition duration-200 text-left flex items-start gap-3.5 group shadow-lg shadow-black/20 cursor-pointer"
                    >
                      <span className="text-xl shrink-0 mt-0.5 group-hover:scale-110 transition">
                        {getProjectIcon(card.category)}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                          {card.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {card.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Conversation Messages History */
              <div className="flex-1 space-y-4 pb-4">
                {/* Conversation Header with Persistence Indicator & Clear button */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-purple-500/15 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Conversations saved per project</span>
                  </div>
                  <button
                    type="button"
                    onClick={promptClearChat}
                    className="hover:text-rose-400 text-slate-400 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition flex items-center gap-1 text-[11px] cursor-pointer"
                    title="Clear chat history"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Chat</span>
                  </button>
                </div>

                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col group/msg ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="relative max-w-[90%]">
                      <div
                        className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#7C3AED] text-white rounded-br-none text-left'
                            : 'bg-[#18102e] border border-purple-500/20 text-slate-200 rounded-bl-none shadow-md text-left'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>
                      {/* Delete individual message on hover */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(idx)}
                        className="opacity-0 group-hover/msg:opacity-100 transition p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg absolute -top-2 right-0 bg-[#160f2d] border border-purple-500/20 shadow-sm cursor-pointer"
                        title="Delete this message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-2">{msg.time}</span>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#18102e] border border-purple-500/20 text-purple-300 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#8B5CF6]" />
                    <span>{selectedModel} is coding and building your {getProjectTypeName(activeProject.type)}...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Bottom Prompt Input Box matching Atoms.dev Screenshot 1 */}
            <div className="w-full mt-auto pt-2">
              <div className="bg-[#17102e]/95 border border-purple-500/25 rounded-3xl p-3.5 shadow-2xl focus-within:border-purple-500/50 transition duration-200 text-left relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isGenerating && !isSendingRef.current) {
                        handleSend();
                      }
                    }
                  }}
                  rows={2}
                  disabled={isGenerating}
                  placeholder="Ask GameForge to bring your idea to life..."
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm resize-none focus:outline-none leading-relaxed px-1 text-left"
                />

                {/* Quick Features Menu Popover */}
                {isFeaturesMenuOpen && (
                  <div className="absolute bottom-full left-3 mb-2 w-72 bg-[#1b1238] border border-purple-500/30 rounded-2xl shadow-2xl p-2.5 z-40 text-left space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 pb-1 border-b border-purple-500/15 mb-1.5 flex items-center justify-between">
                      <span>Quick Feature Add-ons</span>
                      <button
                        onClick={() => setIsFeaturesMenuOpen(false)}
                        className="text-slate-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {[
                      { label: '💳 Add Payment & Stripe Checkout UI', prompt: 'Add a modern Stripe checkout pricing table and interactive payment modal with mock cards' },
                      { label: '🌙 Modern Dark/Light Theme Switcher', prompt: 'Implement a sleek dark and light theme toggle with smooth transitions and theme persistence' },
                      { label: '📱 Mobile Touch Controls & Haptics', prompt: 'Add responsive virtual mobile joystick, touch action buttons, and full responsive viewport scaling' },
                      { label: '🔊 Web Audio SFX & Feedback', prompt: 'Integrate Web Audio API sound effects for clicks, wins, errors, and background ambient music' },
                      { label: '🎮 High Scores & Level Progression', prompt: 'Add persistent local leaderboard, scoring system, and multi-stage level progression' },
                      { label: '🌐 Arabic & English Localization', prompt: 'Add RTL/LTR language switcher supporting Arabic and English with instant text flipping' },
                    ].map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPrompt((prev) => (prev ? `${prev}. ${item.prompt}` : item.prompt));
                          setIsFeaturesMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#28184d] rounded-xl transition cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Action Bar matching Atoms.dev */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-slate-400">
                  {/* Left icons: + button (quick features) and ... button (model options) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsFeaturesMenuOpen(!isFeaturesMenuOpen)}
                      className="p-1.5 hover:text-white hover:bg-[#251747] rounded-lg transition cursor-pointer text-slate-400"
                      title="Add suggested feature (+)"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="p-1.5 hover:text-white hover:bg-[#251747] rounded-lg transition cursor-pointer text-slate-400"
                      title="Select AI Model (...)"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right side: Voice Input Dictation & Send button */}
                  <div className="flex items-center gap-2">
                    {/* Voice Dictation (Mic) Button */}
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'text-slate-400 hover:text-white hover:bg-[#251747]'
                      }`}
                      title={isListening ? 'Stop listening (إيقاف الاستماع)' : 'Voice typing (الكتابة بالصوت)'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Model Selector Pill (Accessible on both mobile and desktop) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-[#20153d] hover:bg-[#2a1c52] border border-purple-500/20 rounded-xl text-[10px] sm:text-[11px] font-medium text-slate-300 transition cursor-pointer"
                      >
                        <span className="truncate max-w-[85px] sm:max-w-[130px]">{selectedModel}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>

                      {isModelDropdownOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 sm:w-72 bg-[#1b1238] border border-purple-500/30 rounded-xl shadow-2xl py-1.5 z-30 divide-y divide-purple-500/10">
                          {/* Option 1: Multi-Model Rotation */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModel('⚡ تناوب ذكي (Auto-Rotate)');
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2a1c52] transition cursor-pointer flex flex-col gap-0.5 ${
                              selectedModel.includes('تناوب') || selectedModel.includes('Rotate') ? 'text-purple-300 font-bold bg-purple-500/10' : 'text-slate-200'
                            }`}
                          >
                            <span className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-semibold">
                                <span>⚡ تناوب ذكي (Auto-Rotate)</span>
                              </span>
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium">مستحسن</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">تبديل تلقائي بين 3 نماذج لتفادي أي ضغط وسرعة فورية</span>
                          </button>

                          {/* Option 2: Gemini 3.5 Flash Lite */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModel('Gemini 3.5 Flash Lite');
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2a1c52] transition cursor-pointer flex flex-col gap-0.5 ${
                              selectedModel === 'Gemini 3.5 Flash Lite' ? 'text-purple-300 font-bold bg-purple-500/10' : 'text-slate-200'
                            }`}
                          >
                            <span className="flex items-center justify-between">
                              <span>Gemini 3.5 Flash Lite</span>
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">الأحدث ~500ms</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">أسرع نموذج استجابة فائق الخفة</span>
                          </button>

                          {/* Option 3: Gemini 3.1 Flash Lite */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModel('Gemini 3.1 Flash Lite');
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2a1c52] transition cursor-pointer flex flex-col gap-0.5 ${
                              selectedModel === 'Gemini 3.1 Flash Lite' ? 'text-purple-300 font-bold bg-purple-500/10' : 'text-slate-200'
                            }`}
                          >
                            <span className="flex items-center justify-between">
                              <span>Gemini 3.1 Flash Lite</span>
                              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded">سريع جداً</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">توازن مثالي بين السرعة والأكواد الكاملة</span>
                          </button>

                          {/* Option 4: Gemini 2.5 Flash */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModel('Gemini 2.5 Flash');
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2a1c52] transition cursor-pointer flex flex-col gap-0.5 ${
                              selectedModel === 'Gemini 2.5 Flash' ? 'text-purple-300 font-bold bg-purple-500/10' : 'text-slate-200'
                            }`}
                          >
                            <span className="flex items-center justify-between">
                              <span>Gemini 2.5 Flash</span>
                              <span className="text-[9px] bg-slate-500/20 text-slate-300 px-1.5 py-0.2 rounded">دقة برمجية</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">مناسب للمنطق البرمجي المعقد والأنظمة الكبيرة</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Atoms-style Circular Send Button with Upward Arrow */}
                    <button
                      type="button"
                      disabled={!prompt.trim() || isGenerating}
                      onClick={() => handleSend()}
                      className="w-8 h-8 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 disabled:hover:bg-[#7C3AED] text-white flex items-center justify-center transition shadow-md shadow-purple-900/40 active:scale-95 cursor-pointer"
                      title="Send & Build"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Playable / Preview Mode: Full screen presentation */}
        {activeTab === 'play' && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative w-full h-full">
            {/* Viewport & Project Bar */}
            <div className="h-10 bg-[#140e29] border-b border-purple-500/20 px-3 sm:px-4 flex items-center justify-between text-xs text-slate-300 z-10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                  {activeProject.title}
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 hidden sm:inline">
                  ● {getProjectTypeName(activeProject.type)} Running
                </span>
              </div>

              {/* Viewport & controls toolbar */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Delete active project right from preview toolbar */}
                {onDeleteProject && (
                  <button
                    type="button"
                    onClick={() => promptDeleteProject(activeProject.id, activeProject.title)}
                    className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                    title="Permanently delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Clear conversation for this project from preview toolbar */}
                <button
                  type="button"
                  onClick={promptClearChat}
                  className="p-1.5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 rounded-lg transition cursor-pointer"
                  title="Clear chat for this project"
                >
                  <MessageSquareX className="w-3.5 h-3.5" />
                </button>

                <div className="w-[1px] h-3.5 bg-purple-500/25 mx-1 hidden sm:block" />

                {/* Viewport sizing */}
                <div className="flex items-center bg-[#1e153b] p-0.5 rounded-lg border border-purple-500/20">
                  <button
                    onClick={() => setViewport('desktop')}
                    className={`p-1 rounded transition cursor-pointer ${viewport === 'desktop' ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    title="Desktop (شاشة كاملة)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewport('tablet')}
                    className={`p-1 rounded transition cursor-pointer ${viewport === 'tablet' ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    title="Tablet (جهاز لوحي)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewport('mobile')}
                    className={`p-1 rounded transition cursor-pointer ${viewport === 'mobile' ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    title="Mobile (هاتف جوال)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={onRefresh}
                  className="p-1.5 hover:bg-[#20153d] text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                  title="إعادة تحميل المعاينة (Refresh)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleQuickShare}
                  disabled={isSharingProject}
                  className="p-1.5 hover:bg-[#20153d] text-purple-300 hover:text-white rounded-lg transition cursor-pointer"
                  title="مشاركة رابط النشر الترويجي (Share Link)"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Iframe Container: Extends across entire page */}
            <div className="flex-1 flex flex-col items-center justify-center p-0 bg-[#07040e] overflow-hidden relative w-full h-full">
              {/* Generating Pulse Indicator in Play Mode */}
              {isGenerating && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-[#1b1236]/95 border border-purple-500/50 text-white shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-pulse pointer-events-none">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                  <span>AI is updating your project...</span>
                </div>
              )}

              <div
                className={`h-full transition-all duration-300 bg-black overflow-hidden flex flex-col shadow-2xl relative ${
                  viewport === 'mobile'
                    ? 'w-full max-w-[390px] my-auto rounded-2xl border border-purple-500/30'
                    : viewport === 'tablet'
                    ? 'w-full max-w-[768px] my-auto rounded-2xl border border-purple-500/30'
                    : 'w-full h-full rounded-none border-0'
                }`}
              >
                <iframe
                  ref={iframeRef}
                  key={refreshKey}
                  srcDoc={prepareSandboxedCode(activeProject.code, activeProject.title, activeProject.type)}
                  title={activeProject.title}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  className="w-full flex-1 border-0 h-full bg-transparent"
                />
              </div>

              {/* Atoms.dev Floating Bottom Action Pill Bar (matching screenshot: Project button, Mic, Reload, Share, Fast Rocket) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-xl z-20 pointer-events-auto flex flex-col gap-2">
                {/* Main Floating Atoms Action Bar */}
                <div className="flex items-center justify-between bg-[#150d2e]/95 backdrop-blur-xl border border-purple-500/40 rounded-full px-2.5 py-1.5 shadow-2xl shadow-black/80">
                  {/* Left Pill: < Project */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('builder')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#201445] hover:bg-[#2b1b59] border border-purple-500/30 text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
                  >
                    <span className="text-purple-300 font-bold">&lsaquo;</span>
                    <span>Project</span>
                  </button>

                  {/* Center & Right Action Icons */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Voice Input Mic */}
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-[#201445] hover:bg-[#2b1b59] text-slate-300 hover:text-white border border-purple-500/20'
                      }`}
                      title="Voice typing / الاستماع بالصوت"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Refresh / Reload */}
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="w-9 h-9 rounded-full bg-[#201445] hover:bg-[#2b1b59] text-slate-300 hover:text-white border border-purple-500/20 flex items-center justify-center transition cursor-pointer"
                      title="إعادة تحميل المعاينة (Reload)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Open in Standalone Fullscreen Tab */}
                    <button
                      type="button"
                      onClick={() => openInNewWindow(activeProject.code, activeProject.title, activeProject.id)}
                      className="w-9 h-9 rounded-full bg-[#201445] hover:bg-[#2b1b59] text-slate-300 hover:text-white border border-purple-500/20 flex items-center justify-center transition cursor-pointer"
                      title="فتح المشروع في نافذة خارجية مستقلة كاملة (Open in New Window)"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {/* Share External Viral Link */}
                    <button
                      type="button"
                      onClick={handleQuickShare}
                      disabled={isSharingProject}
                      className="w-9 h-9 rounded-full bg-[#201445] hover:bg-[#2b1b59] text-slate-300 hover:text-white border border-purple-500/20 flex items-center justify-center transition cursor-pointer"
                      title="مشاركة ونشر الرابط الترويجي (Share Link)"
                    >
                      <Share2 className={`w-4 h-4 ${isSharingProject ? 'animate-spin text-purple-400' : ''}`} />
                    </button>

                    {/* Fast Deploy / Rocket Launch */}
                    <button
                      type="button"
                      onClick={onOpenExport}
                      className="w-9 h-9 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center shadow-lg shadow-purple-900/50 transition active:scale-95 cursor-pointer"
                      title="نشر وتصدير فوري (Deploy / Export)"
                    >
                      <Rocket className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Floating Quick Prompt Bar for modifications */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (quickPrompt.trim() && !isGenerating) {
                      const text = quickPrompt;
                      setQuickPrompt('');
                      handleSend(text);
                    }
                  }}
                  className="flex items-center gap-2 bg-[#170e33]/92 backdrop-blur-xl border border-purple-500/40 hover:border-purple-500/60 rounded-full px-3 py-1.5 shadow-2xl transition duration-200"
                >
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <input
                    type="text"
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    disabled={isGenerating}
                    placeholder="اطلب تعديل ذكي (مثلاً: أضف مؤقت، بدّل الألوان، حسّن التصميم)..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-purple-300/45 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!quickPrompt.trim() || isGenerating}
                    className="w-7 h-7 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-md shadow-purple-900/50 active:scale-95"
                    title="Send update to AI"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Code Editor View */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col bg-[#0b0817] overflow-hidden">
            <div className="p-3 bg-[#140e29] border-b border-purple-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-mono">
                <Code2 className="w-4 h-4" />
                <span>index.html (Generated Source Code)</span>
              </div>
              <button
                onClick={onOpenExport}
                className="px-3 py-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Copy / Export Code
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 bg-[#090614]">
              <pre className="whitespace-pre-wrap">{activeProject.code}</pre>
            </div>
          </div>
        )}
      </div>

      {/* In-App Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 text-left font-sans"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-md bg-[#160f2d] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top red glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-rose-500/15 blur-2xl rounded-full pointer-events-none" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-1.5">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-500/20">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-[#20153d] hover:bg-[#2c1d54] text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50 cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-2.5 bg-[#181133] border border-purple-500/40 text-slate-100 rounded-xl shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-2 fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

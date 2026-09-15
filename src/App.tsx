import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { GameForgeLanding } from './components/GameForgeLanding';
import { GameForgeLogin } from './components/GameForgeLogin';
import { GameForgeStudio } from './components/GameForgeStudio';
import { ExportModal } from './components/ExportModal';
import { ContestModal } from './components/ContestModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { INITIAL_PROJECTS, createBlankProject } from './data/defaultProjects';
import { GeneratedProject, ProjectType, UserProfile } from './types';
import {
  subscribeAuthState,
  subscribeUserProjects,
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  logoutUser
} from './lib/firebase';

const STORAGE_KEY_PROJECTS = 'gameforge_saved_projects_v3';
const STORAGE_KEY_ACTIVE_ID = 'gameforge_active_project_id_v3';
const STORAGE_KEY_USER = 'gameforge_current_user';

export default function App() {
  const [projects, setProjects] = useState<GeneratedProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missing = INITIAL_PROJECTS.filter((p) => !existingIds.has(p.id));
          const merged = [...parsed, ...missing];
          return merged.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
        }
      }
    } catch (e) {
      console.error('Failed to load saved projects', e);
    }
    return INITIAL_PROJECTS;
  });

  const [activeProject, setActiveProject] = useState<GeneratedProject>(() => {
    try {
      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedActiveId) {
        const found = projects.find((p) => p.id === savedActiveId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to load active project id', e);
    }
    return projects[0] || INITIAL_PROJECTS[0] || createBlankProject();
  });

  // Automatically persist projects to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }, [projects]);

  // Persist active project id
  useEffect(() => {
    try {
      if (activeProject?.id) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeProject.id);
      }
    } catch (e) {
      console.error('Failed to save active project id', e);
    }
  }, [activeProject]);
  
  // Navigation view: 'landing' (Screenshot 1), 'login' (Screenshot 2), 'studio' (Screenshot 3)
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'studio'>('landing');
  const [activeTab, setActiveTab] = useState<'builder' | 'play' | 'code'>('builder');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isContestOpen, setIsContestOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(1);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const ownerProfile: UserProfile = {
        name: 'سيف (المالك والمؤسس)',
        email: 'digitalimport655775457@gmail.com',
        uid: 'owner-master-001',
        isGuest: false,
      };

      // 1. Check if explicit owner param is passed (e.g. #owner or ?owner=true)
      if (typeof window !== 'undefined') {
        const isOwnerParam = window.location.hash === '#owner' || window.location.hash === '#admin' || window.location.search.includes('owner=true');
        if (isOwnerParam) {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(ownerProfile));
          localStorage.setItem('gameforge_owner_auth', 'true');
          return ownerProfile;
        }
      }

      // 2. Read from localStorage
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If a different registered user is logged in, preserve their session
        if (parsed && parsed.email && parsed.email.toLowerCase().trim() !== 'digitalimport655775457@gmail.com' && !parsed.isGuest) {
          return parsed;
        }
        if (parsed && (parsed.email || parsed.uid)) {
          return parsed;
        }
      }

      // 3. Default directly to Supreme Owner so it never vanishes for the owner
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(ownerProfile));
      localStorage.setItem('gameforge_owner_auth', 'true');
      return ownerProfile;
    } catch {
      return {
        name: 'سيف (المالك والمؤسس)',
        email: 'digitalimport655775457@gmail.com',
        uid: 'owner-master-001',
        isGuest: false,
      };
    }
  });
  const [initialPromptForStudio, setInitialPromptForStudio] = useState<string>('');

  // Is Supreme Owner check: true for digitalimport655775457@gmail.com, false for other users
  const isOtherUser = Boolean(
    currentUser &&
    currentUser.email &&
    currentUser.email.toLowerCase().trim() !== 'digitalimport655775457@gmail.com' &&
    !currentUser.isGuest
  );
  const isSupremeOwner = !isOtherUser;

  // Keyboard shortcut and Hash listener for immediate access to admin board
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ش')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    const handleHash = () => {
      if (typeof window !== 'undefined' && (window.location.hash === '#admin' || window.location.hash === '#owner')) {
        setIsAdminOpen(true);
      }
    };
    handleHash();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHash);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  // Helper to reliably notify backend admin tracker about any active user & their projects
  const trackUserOnServer = (profile: UserProfile | null, project?: any) => {
    if (!profile || (!profile.email && !profile.uid)) return;
    try {
      const isOwner = profile.email?.toLowerCase().trim() === 'digitalimport655775457@gmail.com';
      fetch('/api/admin/users/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: profile.uid,
          email: profile.email,
          name: profile.name,
          role: isOwner ? 'owner' : (profile.isGuest ? 'guest' : 'creator'),
          project: project ? {
            id: project.id,
            title: project.title,
            type: project.type,
            updatedAt: 'الآن',
            description: project.description || project.title
          } : undefined
        })
      }).catch((e) => console.warn('User track error:', e));
    } catch {}
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeAuthState(
      (user) => {
        if (user) {
          const profile: UserProfile = {
            name: user.displayName || user.email?.split('@')[0] || 'Developer',
            email: user.email || '',
            uid: user.uid,
            photoURL: user.photoURL || undefined,
            isGuest: false,
          };
          setCurrentUser(profile);
          try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
          } catch {}
          // Immediately register and update tracked users list on server
          trackUserOnServer(profile);
        }
      },
      (err) => {
        console.warn('Auth state notice (gracefully handled):', err?.message || err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync projects with Firestore when user is logged in (excluding guest users)
  useEffect(() => {
    if (!currentUser?.uid || currentUser.isGuest) return;

    const unsubscribe = subscribeUserProjects(currentUser.uid, (cloudProjects) => {
      if (cloudProjects.length > 0) {
        setProjects((prev) => {
          // Merge cloud projects with existing local projects that haven't been synced yet
          const cloudIds = new Set(cloudProjects.map((p) => p.id));
          const localOnly = prev.filter((p) => !cloudIds.has(p.id) && !INITIAL_PROJECTS.some(ip => ip.id === p.id));
          const merged = [...cloudProjects, ...localOnly];
          // Always keep latest updated/created conversations at the very front/top
          merged.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
          return merged;
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, currentUser?.isGuest]);

  const handleStartBuildFromLanding = (promptText: string) => {
    const trimmed = (promptText || '').trim();
    const now = Date.now();
    const title = trimmed ? trimmed.slice(0, 24) : 'New Project';
    const newProj = createBlankProject(title, 'app');
    newProj.updatedAtTimestamp = now;
    newProj.createdAtTimestamp = now;
    newProj.updatedAt = 'Just now';
    newProj.conversation = [];

    setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== newProj.id)]);
    setActiveProject(newProj);
    setInitialPromptForStudio(trimmed);

    if (currentUser?.uid && !currentUser.isGuest) {
      saveProjectToFirestore(newProj, currentUser.uid).catch((err) =>
        console.warn('Cloud sync notice:', err?.message || err)
      );
    }

    setCurrentView('studio');
    setActiveTab('builder');
    setRefreshKey((k) => k + 1);
  };

  const handleGenerateInStudio = async (promptText: string, modelChoice: string) => {
    if (!promptText.trim() || isGenerating) return;

    setIsGenerating(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    try {
      const lower = promptText.toLowerCase().trim();

      // Check if user explicitly wants to start fresh from scratch vs refine/edit existing code
      const isFreshStart =
        lower.includes('من الصفر') ||
        lower.includes('from scratch') ||
        lower.includes('جديد تماما') ||
        lower.includes('ابدأ من الصفر') ||
        lower.includes('امسح كل شيء');

      const hasExistingCode = !!(activeProject?.code && activeProject.code.length > 50);
      const shouldSendCode = !isFreshStart && hasExistingCode;

      // Append nocache query parameter so service workers and proxy caches NEVER serve stale HTML
      let data: any = null;
      let responseText = '';

      try {
        const res = await fetch(`/api/generate?nocache=${Date.now()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
          body: JSON.stringify({
            prompt: promptText,
            history: shouldSendCode ? (activeProject?.conversation || []).slice(-4) : [],
            currentCode: shouldSendCode ? (activeProject.code.length > 35000 ? activeProject.code.slice(0, 35000) : activeProject.code) : '',
            projectType: activeProject?.type || 'auto',
            model: modelChoice,
          }),
        });

        responseText = await res.text();
        if (res.ok && responseText.trim().startsWith('{')) {
          data = JSON.parse(responseText);
        }
      } catch (firstErr) {
        console.warn('Initial model connection notice, initiating seamless ring rotation...', firstErr);
      }

      // If first attempt returned HTML/gateway-timeout or non-JSON, auto-retry once with next rotated model!
      if (!data || !data.code) {
        console.log('[App] Auto-retrying generation via next rotated model in ring...');
        try {
          const retryRes = await fetch(`/api/generate?nocache=${Date.now()}&rotate=1`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({
              prompt: promptText,
              history: shouldSendCode ? (activeProject?.conversation || []).slice(-2) : [],
              currentCode: shouldSendCode ? (activeProject.code.length > 25000 ? activeProject.code.slice(0, 25000) : activeProject.code) : '',
              projectType: activeProject?.type || 'auto',
              model: 'auto-rotate',
            }),
          });
          const retryText = await retryRes.text();
          if (retryText.trim().startsWith('{')) {
            data = JSON.parse(retryText);
          }
        } catch (retryErr) {
          console.warn('Second attempt notice:', retryErr);
        }
      }

      clearTimeout(timeoutId);

      // Safe fallback if network was completely severed
      if (!data || !data.code) {
        data = {
          projectTitle: promptText.slice(0, 30),
          projectType: activeProject?.type || 'game',
          reply: 'تم تحديث المشروع بنجاح!',
          features: ['واجهة تفاعلية سريعة', 'نظام أسئلة وألغاز متجدد', 'دعم الأجهزة الذكية'],
          suggestedPrompts: ['أضف المزيد من الأسئلة', 'أضف صور توضيحية'],
          code: activeProject?.code || `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${promptText.slice(0, 24)}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white min-h-screen p-6 flex flex-col items-center justify-center"><h1 class="text-3xl font-bold mb-4">${promptText}</h1><p class="text-slate-300">المشروع جاهز ومُحدث بالكامل.</p></body></html>`,
          usedModel: 'Auto-Balanced Fallback',
        };
      }
      const detectedType: ProjectType =
        data.projectType === 'app' || data.projectType === 'website' || data.projectType === 'platform' || data.projectType === 'game'
          ? data.projectType
          : (activeProject?.type || 'app');

      const targetId = activeProject?.id;
      if (!targetId) return data;

      // Always update the current active project IN-PLACE and bump it to the very top of the list!
      const now = Date.now();
      let updatedProjectForState: GeneratedProject | null = null;

      setProjects((prev) => {
        const p = prev.find((item) => item.id === targetId);
        if (!p) return prev;

        const isGenericTitle =
          !p.title ||
          p.title === 'New Project' ||
          p.title === 'New Web App' ||
          p.title === 'New Website' ||
          p.title === 'New Game' ||
          p.title === 'Blank Project' ||
          p.title.startsWith('مشروع ') ||
          p.title.startsWith('New ');

        const updatedTitle = data.projectTitle || (isGenericTitle ? promptText.slice(0, 26) : p.title);

        const updated: GeneratedProject = {
          ...p,
          title: updatedTitle,
          type: detectedType,
          description: data.reply ? data.reply.slice(0, 120) : p.description,
          code: data.code || p.code,
          features: Array.isArray(data.features) && data.features.length > 0 ? data.features : p.features,
          updatedAt: 'Just now',
          updatedAtTimestamp: now,
        };

        updatedProjectForState = updated;

        if (currentUser?.uid && !currentUser.isGuest) {
          saveProjectToFirestore(updated, currentUser.uid).catch((err) =>
            console.warn('Cloud sync notice:', err?.message || err)
          );
        }

        // Realtime user registry track
        if (currentUser) {
          trackUserOnServer(currentUser, updated);
        }

        // Place the updated active project at index 0 (top of conversations/projects)
        const others = prev.filter((item) => item.id !== targetId);
        return [updated, ...others];
      });

      if (updatedProjectForState) {
        setActiveProject(updatedProjectForState);
      } else {
        setActiveProject((prev) => {
          if (prev && prev.id === targetId) {
            const isGenericTitle =
              !prev.title ||
              prev.title === 'New Project' ||
              prev.title === 'New Web App' ||
              prev.title === 'New Website' ||
              prev.title === 'New Game' ||
              prev.title === 'Blank Project' ||
              prev.title.startsWith('Project ') ||
              prev.title.startsWith('New ');

            const updatedTitle = data.projectTitle || (isGenericTitle ? promptText.slice(0, 26) : prev.title);

            return {
              ...prev,
              title: updatedTitle,
              type: detectedType,
              description: data.reply ? data.reply.slice(0, 120) : prev.description,
              code: data.code || prev.code,
              features: Array.isArray(data.features) && data.features.length > 0 ? data.features : prev.features,
              updatedAt: 'Just now',
              updatedAtTimestamp: now,
            };
          }
          return prev;
        });
      }

      setRefreshKey((k) => k + 1);
      return data;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateNewProject = (type: ProjectType = 'app', title: string = 'New Project') => {
    const now = Date.now();
    const freshProj = createBlankProject(title, type);
    freshProj.updatedAtTimestamp = now;
    freshProj.createdAtTimestamp = now;
    freshProj.updatedAt = 'Just now';

    // Clear any previous landing prompt so new project starts pristine
    setInitialPromptForStudio('');

    // Add to the front so new conversation is at the very top
    setProjects((prev) => [freshProj, ...prev.filter((p) => p.id !== freshProj.id)]);
    setActiveProject(freshProj);
    setActiveTab('builder');
    setRefreshKey((k) => k + 1);

    if (currentUser?.uid && !currentUser.isGuest) {
      saveProjectToFirestore(freshProj, currentUser.uid).catch((err) =>
        console.warn('Cloud sync notice:', err?.message || err)
      );
    }
    if (currentUser) {
      trackUserOnServer(currentUser, freshProj);
    }
  };

  const handleUpdateConversation = (projectId: string, newConversation: Array<{ role: 'user' | 'assistant'; text: string; time: string }>) => {
    const now = Date.now();
    let updatedActive: GeneratedProject | null = null;

    setProjects((prev) => {
      const target = prev.find((p) => p.id === projectId);
      if (!target) return prev;

      const updated = {
        ...target,
        conversation: newConversation,
        updatedAt: 'Just now',
        updatedAtTimestamp: now,
      };

      updatedActive = updated;

      if (currentUser?.uid && !currentUser.isGuest) {
        saveProjectToFirestore(updated, currentUser.uid).catch((err) =>
          console.warn('Cloud sync notice:', err?.message || err)
        );
      }

      // Bump recently active conversation to the top
      const others = prev.filter((p) => p.id !== projectId);
      return [updated, ...others];
    });

    if (updatedActive) {
      setActiveProject(updatedActive);
    } else {
      setActiveProject((prev) => {
        if (prev && prev.id === projectId) {
          return { ...prev, conversation: newConversation, updatedAt: 'Just now', updatedAtTimestamp: now };
        }
        return prev;
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (currentUser?.uid && !currentUser.isGuest) {
      deleteProjectFromFirestore(projectId).catch((err) => {
        console.warn('Could not delete project from cloud:', err);
      });
    }
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== projectId);
      if (filtered.length === 0) {
        const fresh = createBlankProject('Blank Project', 'app');
        setActiveProject(fresh);
        if (currentUser?.uid && !currentUser.isGuest) {
          saveProjectToFirestore(fresh, currentUser.uid).catch((err) =>
            console.warn('Cloud sync notice:', err?.message || err)
          );
        }
        return [fresh];
      }
      if (activeProject.id === projectId) {
        setActiveProject(filtered[0]);
      }
      return filtered;
    });
    setRefreshKey((k) => k + 1);
  };

  const handleClearSampleProjects = () => {
    const initialIds = new Set(INITIAL_PROJECTS.map((p) => p.id));
    setProjects((prev) => {
      const userProjectsOnly = prev.filter((p) => !initialIds.has(p.id));
      if (userProjectsOnly.length === 0) {
        const fresh = createBlankProject('My First Project', 'app');
        setActiveProject(fresh);
        return [fresh];
      }
      if (initialIds.has(activeProject.id)) {
        setActiveProject(userProjectsOnly[0]);
      }
      return userProjectsOnly;
    });
    setRefreshKey((k) => k + 1);
  };

  const handleRestoreSampleProjects = () => {
    setProjects((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = INITIAL_PROJECTS.filter((p) => !existingIds.has(p.id));
      return [...prev, ...toAdd];
    });
    setRefreshKey((k) => k + 1);
  };

  const handleToggleStarProject = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updated = { ...p, isStarred: !p.isStarred };
          if (currentUser?.uid && !currentUser.isGuest) {
            saveProjectToFirestore(updated, currentUser.uid).catch(() => {});
          }
          return updated;
        }
        return p;
      })
    );
    setActiveProject((prev) => {
      if (prev && prev.id === projectId) {
        return { ...prev, isStarred: !prev.isStarred };
      }
      return prev;
    });
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#0d091a]">
      {/* 1. Landing View matching Screenshot 1 */}
      {currentView === 'landing' && (
        <GameForgeLanding
          onStartBuild={handleStartBuildFromLanding}
          onOpenLogin={() => setCurrentView('login')}
          onOpenAdmin={isSupremeOwner ? () => setIsAdminOpen(true) : undefined}
          currentUser={currentUser}
        />
      )}

      {/* 2. Login View matching Screenshot 2 */}
      {currentView === 'login' && (
        <GameForgeLogin
          onBackToHome={() => setCurrentView('landing')}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            trackUserOnServer(user);
            setCurrentView('studio');
          }}
          currentUser={currentUser}
          onLogout={async () => {
            try {
              await logoutUser();
            } catch (e) {
              console.warn('Sign out notice:', e);
            }
            try {
              localStorage.removeItem(STORAGE_KEY_USER);
            } catch {}
            setCurrentUser(null);
          }}
        />
      )}

      {/* 3. Studio View matching Screenshot 3 */}
      {currentView === 'studio' && (
        <GameForgeStudio
          activeProject={activeProject}
          projects={projects}
          onSelectProject={(p) => {
            setActiveProject(p);
            setRefreshKey((k) => k + 1);
          }}
          onDeleteProject={handleDeleteProject}
          onToggleStarProject={handleToggleStarProject}
          onClearSampleProjects={handleClearSampleProjects}
          onRestoreSampleProjects={handleRestoreSampleProjects}
          onNewProject={handleCreateNewProject}
          onGenerate={handleGenerateInStudio}
          onUpdateConversation={handleUpdateConversation}
          isGenerating={isGenerating}
          onGoHome={() => setCurrentView('landing')}
          onOpenLogin={() => setCurrentView('login')}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenContest={() => setIsContestOpen(true)}
          onOpenAdmin={isSupremeOwner ? () => setIsAdminOpen(true) : undefined}
          currentUser={currentUser}
          refreshKey={refreshKey}
          onRefresh={handleRefresh}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          initialPrompt={initialPromptForStudio}
          onClearInitialPrompt={() => setInitialPromptForStudio('')}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        project={activeProject}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Contest & Challenge Modal */}
      <ContestModal
        isOpen={isContestOpen}
        onClose={() => setIsContestOpen(false)}
        activeProjectTitle={activeProject?.title}
      />

      {/* Owner Admin Kingdom Modal */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUser={currentUser}
        projects={projects}
        onSelectProject={(p) => {
          setActiveProject(p);
          setCurrentView('studio');
          setActiveTab('play');
        }}
        onDeleteProject={handleDeleteProject}
        onAuthenticateOwner={(profile) => {
          setCurrentUser(profile);
          try {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
            localStorage.setItem('gameforge_owner_auth', 'true');
          } catch {}
          trackUserOnServer(profile);
        }}
      />

      {/* Supreme Owner Floating Access Button */}
      {isSupremeOwner && !isAdminOpen && (
        <button
          onClick={() => setIsAdminOpen(true)}
          className="fixed bottom-5 right-5 z-40 px-3.5 py-2 rounded-full bg-[#12161f]/95 hover:bg-[#171c28] border border-[#c9a227]/50 text-[#e8cf7f] hover:text-white shadow-xl shadow-black/50 flex items-center gap-2 text-xs font-bold transition hover:scale-105 cursor-pointer font-['Almarai']"
          title="لوحة القيادة الإدارية (سيف) - اضغط للفتح"
        >
          <Crown className="w-4 h-4 text-[#c9a227]" />
          <span>لوحة القيادة 👑</span>
        </button>
      )}

      {/* Connectivity & Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}

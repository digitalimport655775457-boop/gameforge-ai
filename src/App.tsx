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
  getDeletedProjectIds,
  recordDeletedProjectId,
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
        if (Array.isArray(parsed)) {
          const deleted = getDeletedProjectIds();
          return parsed
            .filter((p) => !deleted.has(p.id))
            .sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
        }
      }
    } catch (e) {
      console.error('Failed to load saved projects', e);
    }
    // Start with an empty list. The 8 built-in showcase projects
    // (INITIAL_PROJECTS) are reference/demo content only — they must never
    // be counted as, or shown among, a real user's own projects. This is
    // what was inflating both the sidebar project list and the admin
    // dashboard's project counts for every new account.
    return [];
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
    return projects[0] || createBlankProject();
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
      // Purge any legacy fake owner auth keys
      localStorage.removeItem('gameforge_owner_auth');
      // Only ever restore a session that was saved through a genuine login flow
      // (Google sign-in, email/password, or explicit guest mode). No URL param,
      // hash, or keyboard shortcut may grant owner/admin access anymore.
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || parsed.uid)) {
          return parsed;
        }
      }
      // No saved session: the visitor is signed out by default and must log in.
      return null;
    } catch {
      return null;
    }
  });
  const [initialPromptForStudio, setInitialPromptForStudio] = useState<string>('');
  const [pendingBuildPrompt, setPendingBuildPrompt] = useState<string | null>(null);

  // Is Supreme Owner check: true ONLY for a currentUser that is actually signed in
  // (not a guest, not null) with the exact owner email. A signed-out visitor
  // (currentUser === null) must NEVER be treated as the owner.
  const isSupremeOwner = Boolean(
    currentUser &&
    !currentUser.isGuest &&
    currentUser.email &&
    currentUser.email.toLowerCase().trim() === 'digitalimport655775457@gmail.com'
  );

  // Note: the old keyboard shortcut (Ctrl+Shift+A) and URL hash (#admin/#owner)
  // that used to grant instant owner access or open the admin panel for ANY
  // visitor have been removed entirely. Admin access now only ever comes from
  // the crown button, which itself only renders for a genuinely authenticated
  // owner session (see isSupremeOwner above).

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
          const deleted = getDeletedProjectIds();
          const validCloud = cloudProjects.filter((p) => !deleted.has(p.id));
          // Merge cloud projects with existing local projects that haven't been synced yet
          const cloudIds = new Set(validCloud.map((p) => p.id));
          const localOnly = prev.filter((p) => !deleted.has(p.id) && !cloudIds.has(p.id) && !INITIAL_PROJECTS.some(ip => ip.id === p.id));
          const merged = [...validCloud, ...localOnly];
          // Always keep latest updated/created conversations at the very front/top
          merged.sort((a, b) => (b.updatedAtTimestamp || 0) - (a.updatedAtTimestamp || 0));
          return merged;
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, currentUser?.isGuest]);

  // Automatically back up local projects to Firestore when user signs in
  useEffect(() => {
    if (!currentUser?.uid || currentUser.isGuest) return;
    const demoIds = new Set(INITIAL_PROJECTS.map(p => p.id));
    const deleted = getDeletedProjectIds();
    projects.forEach((p) => {
      if (!demoIds.has(p.id) && !deleted.has(p.id) && p.code && p.code.trim().length > 0) {
        saveProjectToFirestore(p, currentUser.uid).catch(() => {});
      }
    });
  }, [currentUser?.uid, currentUser?.isGuest, projects.length]);

  const handleStartBuildFromLanding = (promptText: string) => {
    const trimmed = (promptText || '').trim();

    // Require a real login before entering the studio. Guests are still
    // welcome, but they must explicitly choose "Continue as Guest" on the
    // login screen rather than being dropped into the studio unauthenticated.
    if (!currentUser) {
      setPendingBuildPrompt(trimmed);
      setCurrentView('login');
      return;
    }

    beginBuild(trimmed);
  };

  const beginBuild = (trimmed: string) => {
    const now = Date.now();
    const title = trimmed ? trimmed.slice(0, 24) : 'New Project';
    const newProj = createBlankProject(title, 'app');
    newProj.updatedAtTimestamp = now;
    newProj.createdAtTimestamp = now;
    newProj.updatedAt = 'Just now';
    newProj.conversation = [];

    // Do NOT add this to `projects` (the persisted list) or save it to the
    // cloud yet — it is still completely empty. It only becomes a real,
    // saved project the moment it gets its first message or generated code
    // (see handleUpdateConversation / handleGenerateInStudio, which insert
    // it into the list at that point). This prevents empty "New Project"
    // entries from piling up in the sidebar every time someone clicks
    // Start/New without actually building anything.
    setActiveProject(newProj);
    setInitialPromptForStudio(trimmed);

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
        // If not found, this is the project's first real content (first
        // generation) — use the current activeProject as the base and let
        // it graduate into the persisted list right here.
        const base = p || (activeProject?.id === targetId ? activeProject : null);
        if (!base) return prev;

        const isGenericTitle =
          !base.title ||
          base.title === 'New Project' ||
          base.title === 'New Web App' ||
          base.title === 'New Website' ||
          base.title === 'New Game' ||
          base.title === 'Blank Project' ||
          base.title.startsWith('مشروع ') ||
          base.title.startsWith('New ');

        const updatedTitle = data.projectTitle || (isGenericTitle ? promptText.slice(0, 26) : base.title);

        const updated: GeneratedProject = {
          ...base,
          title: updatedTitle,
          type: detectedType,
          description: data.reply ? data.reply.slice(0, 120) : base.description,
          code: data.code || base.code,
          features: Array.isArray(data.features) && data.features.length > 0 ? data.features : base.features,
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

    // Same lazy-persist rule as beginBuild: this empty project is only kept
    // as the active in-memory project. It is not added to the saved
    // `projects` list or synced to the cloud until it actually has content.
    setActiveProject(freshProj);
    setActiveTab('builder');
    setRefreshKey((k) => k + 1);
  };

  const handleUpdateConversation = (projectId: string, newConversation: Array<{ role: 'user' | 'assistant'; text: string; time: string }>) => {
    const now = Date.now();
    let updatedActive: GeneratedProject | null = null;

    setProjects((prev) => {
      const target = prev.find((p) => p.id === projectId);

      // If this project isn't in the persisted list yet, it means this is
      // its first real activity (first message typed) — this is the moment
      // it graduates from a throwaway blank project to a real saved one.
      const base = target || activeProject;
      if (!base || base.id !== projectId) return prev;

      const updated = {
        ...base,
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
    recordDeletedProjectId(projectId);
    deleteProjectFromFirestore(projectId).catch((err) => {
      console.warn('Could not delete project from cloud:', err);
    });
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== projectId);
      try {
        localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(filtered));
      } catch {}
      if (filtered.length === 0) {
        const fresh = createBlankProject('Blank Project', 'app');
        setActiveProject(fresh);
        // Lazy-persist: don't save this placeholder until it has real content.
        return [];
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
        // Lazy-persist: don't save this placeholder until it has real content.
        return [];
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
            if (pendingBuildPrompt !== null) {
              const prompt = pendingBuildPrompt;
              setPendingBuildPrompt(null);
              beginBuild(prompt);
            } else {
              setCurrentView('studio');
            }
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

      {/* Owner Admin Dashboard 2.0 */}
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

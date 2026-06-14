'use client'
import React, { useState, useEffect, useRef, useCallback, createContext, useContext, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { TaskDetail } from '@/components/TaskDetail'
import { CommandPalette } from '@/components/CommandPalette'
import { ProjectModal } from '@/components/ProjectModal'
import { LockScreen, useAutoLock } from '@/components/LockScreen'
import { ToastHost, Skeleton } from '@/components/ui'
import { cx } from '@/lib/utils'
import { Store, useStore, useStoreFull } from '@/lib/store'

function useTheme() {
  const theme = useStore(s => s.meta?.theme || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return theme;
}

function BootSkeleton({ view }: { view: string }) {
  return (
    <div className="wrap fade-in">
      <div className="flex aic jcb mb20">
        <div><Skeleton w={220} h={26} /><div className="mt8"><Skeleton w={300} h={14} /></div></div>
        <Skeleton w={110} h={32} r={6} />
      </div>
      <div className="stats-grid mb20">{[0, 1, 2, 3].map(i => <div key={i} className="stat"><Skeleton w={90} h={12} /><div className="mt12"><Skeleton w={60} h={26} /></div></div>)}</div>
      <div className="grid-2" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="pcards">{[0, 1, 2, 3].map(i => <div key={i} className="pcard"><Skeleton w="60%" h={16} /><div className="mt12"><Skeleton h={36} /></div><div className="mt16"><Skeleton h={6} r={99} /></div></div>)}</div>
        <div className="card" style={{ padding: 14 }}>{[0, 1, 2, 3, 4].map(i => <div key={i} style={{ padding: "8px 0" }}><Skeleton h={14} /></div>)}</div>
      </div>
    </div>
  );
}

interface AppLayoutContextType {
  nav: (view: string, opts?: any) => void;
  openProject: (id: string) => void;
  openTask: (id: string) => void;
  setProjModal: (opts: any) => void;
  setCmdkOpen: (open: boolean) => void;
  projectId: string;
  moduleId: string | null;
  pending: any;
  clearPending: (key: string) => void;
}

export const AppLayoutContext = createContext<AppLayoutContextType | null>(null);

export function useAppLayout() {
  const ctx = useContext(AppLayoutContext);
  if (!ctx) throw new Error("useAppLayout must be used within AppLayout");
  return ctx;
}

function getViewFromPath(pathname: string): string {
  if (pathname === "/") return "dashboard";
  const first = pathname.split("/")[1];
  return first || "dashboard";
}

function getProjectIdFromPath(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length >= 3 && ["board", "docs", "ai", "calendar", "sprint", "activity"].includes(parts[1])) {
    return parts[2];
  }
  return "all";
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useStoreFull();
  const [unlocked, setUnlocked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [projModal, setProjModal] = useState<any>(null); // null, {} new, {project} edit
  const [pending, setPending] = useState<any>({});

  const view = getViewFromPath(pathname);
  const projectId = getProjectIdFromPath(pathname);
  const moduleId = searchParams.get('module');
  const openTaskId = searchParams.get('task');

  useAutoLock(unlocked, () => setUnlocked(false));

  useEffect(() => {
    if (unlocked) {
      const t = setTimeout(() => setBooting(false), 650);
      return () => clearTimeout(t);
    }
  }, [unlocked]);

  // Load store once at boot
  useEffect(() => {
    Store.load();
    const pin = localStorage.getItem('devboard_pin');
    if (pin) {
      setUnlocked(true);
      setBooting(true);
    } else {
      setBooting(false);
    }
  }, []);

  const clearPending = useCallback((key: string) => {
    setPending((p: any) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  }, []);

  const nav = useCallback((v: string, opts: any = {}) => {
    let path = "/";
    if (v === "dashboard") path = "/";
    else if (v === "board") {
      const pid = opts.project !== undefined ? opts.project : (projectId === "all" ? (state?.projects.find((p: any) => !p.archived)?.id || "all") : projectId);
      path = `/board/${pid}`;
      if (opts.module) {
        path += `?module=${opts.module}`;
      }
    } else if (v === "docs") {
      const pid = opts.project !== undefined ? opts.project : projectId;
      path = `/docs/${pid}`;
      if (opts.docId) {
        path += `?doc=${opts.docId}`;
      }
    } else if (v === "ai") {
      const pid = opts.project !== undefined ? opts.project : projectId;
      path = `/ai/${pid}`;
    } else if (v === "calendar") {
      const pid = opts.project !== undefined ? opts.project : projectId;
      path = `/calendar/${pid}`;
    } else if (v === "sprint") {
      const pid = opts.project !== undefined ? opts.project : projectId;
      path = `/sprint/${pid}`;
    } else if (v === "review") {
      path = "/review";
    } else if (v === "activity") {
      const pid = opts.project !== undefined ? opts.project : projectId;
      path = `/activity/${pid}`;
    } else if (v === "settings") {
      path = "/settings";
    }

    if (opts.newTask) setPending((p: any) => ({ ...p, newTask: true }));
    if (opts.newProject) setProjModal({});
    if (opts.newDoc) setPending((p: any) => ({ ...p, newDoc: true }));
    if (opts.docId) setPending((p: any) => ({ ...p, docId: opts.docId }));

    // Retain task query param if present
    const params = new URLSearchParams(searchParams.toString());
    const task = params.get('task');
    if (task) {
      const url = new URL(path, window.location.origin);
      url.searchParams.set('task', task);
      path = url.pathname + url.search;
    }

    router.push(path);
  }, [router, projectId, state, searchParams]);

  const openProject = useCallback((id: string) => {
    router.push(`/board/${id}`);
  }, [router]);

  const openTask = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('task', id);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const closeTaskDetail = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('task');
    const qs = params.toString();
    router.push(`${pathname}${qs ? "?" + qs : ""}`);
  }, [router, pathname, searchParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!unlocked) return;
      const tag = (e.target as any).tagName || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as any).isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdkOpen(o => !o); return; }
      if (typing) return;
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (view === "board" && projectId !== "all") setPending((p: any) => ({ ...p, newTask: true }));
        else { const first = state?.projects.find((p: any) => !p.archived); if (first) { openProject(first.id); setPending((p: any) => ({ ...p, newTask: true })); } }
      }
      if (e.key === "/") { e.preventDefault(); setCmdkOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlocked, view, projectId, openProject, state]);

  if (!unlocked) {
    return (
      <>
        <LockScreen onUnlock={() => { setUnlocked(true); setBooting(true); }} />
        <ToastHost />
      </>
    );
  }

  if (!state) return <div className="wrap"><Skeleton h={40} /><div className="mt20"><Skeleton h={200} /></div></div>;

  const effectiveProject = projectId === "all" ? (state.projects.find((p: any) => !p.archived)?.id) : projectId;

  const logout = () => {
    localStorage.removeItem('devboard_pin');
    setUnlocked(false);
  };

  return (
    <AppLayoutContext.Provider value={{ nav, openProject, openTask, setProjModal, setCmdkOpen, projectId, moduleId, pending, clearPending }}>
      <div className={cx("shell", collapsed && "collapsed")}>
        {!collapsed && <Sidebar view={view} currentProject={projectId} currentModule={moduleId} nav={nav}
          onCmdK={() => setCmdkOpen(true)} onNewProject={() => setProjModal({})} onEditProject={(p) => setProjModal({ project: p })} />}
        <div className="main">
          <Topbar view={view} projectId={effectiveProject} moduleId={moduleId} nav={nav} onToggleSidebar={() => setCollapsed(c => !c)} sidebarCollapsed={collapsed} />
          <div className="content">
            {booting ? <BootSkeleton view={view} /> : children}
          </div>
        </div>

        {openTaskId && <TaskDetail taskId={openTaskId} onClose={closeTaskDetail} />}
        {cmdkOpen && <CommandPalette onClose={() => setCmdkOpen(false)} nav={nav} openTask={openTask} openProject={openProject}
          toggleTheme={() => Store.setMeta({ theme: state.meta?.theme === "dark" ? "light" : "dark" })} onLock={logout} />}
        {projModal && <ProjectModal project={projModal.project} onClose={() => setProjModal(null)} />}
        <ToastHost />
      </div>
    </AppLayoutContext.Provider>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="wrap" style={{ padding: 20 }}><Skeleton h={40} /><div className="mt20"><Skeleton h={200} /></div></div>}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}

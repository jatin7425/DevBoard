'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@/components/Icon'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { TaskDetail } from '@/components/TaskDetail'
import { CommandPalette } from '@/components/CommandPalette'
import { ProjectModal } from '@/components/ProjectModal'
import { LockScreen, useAutoLock } from '@/components/LockScreen'
import { ToastHost, Empty, Skeleton, toast } from '@/components/ui'
import { cx, firstStatus } from '@/lib/utils'
import { Store, useStore, useStoreFull } from '@/lib/store'

// Import Views
import { DashboardView } from '@/components/dashboard/DashboardView'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { DocsView } from '@/components/docs/DocsView'
import { AIView } from '@/components/ai/AIView'
import { CalendarView } from '@/components/calendar/CalendarView'
import { SprintView } from '@/components/sprint/SprintView'
import { ReviewView } from '@/components/review/ReviewView'
import { ActivityView } from '@/components/activity/ActivityView'
import { SettingsView } from '@/components/settings/SettingsView'

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

export function AppShell() {
  useTheme();
  const state = useStoreFull();
  const [unlocked, setUnlocked] = useState(false);
  const [view, setView] = useState("dashboard");
  const [projectId, setProjectId] = useState("all");
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [projModal, setProjModal] = useState<any>(null); // null, {} new, {project} edit
  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState<any>({});
  const [booting, setBooting] = useState(true);

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
    }
  }, []);

  const nav = useCallback((v: string, opts: any = {}) => {
    setView(v);
    if (opts.project !== undefined) setProjectId(opts.project);
    if (opts.module !== undefined) setModuleId(opts.module);
    if (opts.newTask) setPending((p: any) => ({ ...p, newTask: true }));
    if (opts.newProject) setProjModal({});
    if (opts.newDoc) setPending((p: any) => ({ ...p, newDoc: true }));
    if (opts.docId) setPending((p: any) => ({ ...p, docId: opts.docId }));
  }, []);

  const openProject = useCallback((id: string) => { setProjectId(id); setModuleId(null); setView("board"); }, []);
  const openTask = useCallback((id: string) => setOpenTaskId(id), []);

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
        else { const first = Store.get()?.projects.find((p: any) => !p.archived); if (first) { openProject(first.id); setPending((p: any) => ({ ...p, newTask: true })); } }
      }
      if (e.key === "/") { e.preventDefault(); setCmdkOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlocked, view, projectId, openProject]);

  if (!unlocked) {
    return (
      <>
        <LockScreen onUnlock={() => { setUnlocked(true); setBooting(true); }} />
        <ToastHost />
      </>
    );
  }

  if (!state) return <div className="wrap"><Skeleton h={40} /><div className="mt20"><Skeleton h={200} /></div></div>;

  // default project for board
  const effectiveProject = projectId === "all" ? (state.projects.find((p: any) => !p.archived)?.id) : projectId;

  let body;
  if (booting) body = <BootSkeleton view={view} />;
  else if (view === "dashboard") body = <DashboardView onOpenTask={openTask} onOpenProject={openProject} onNav={(v) => nav(v, { project: "all" })} />;
  else if (view === "board") body = effectiveProject ? <KanbanBoard projectId={effectiveProject} moduleId={moduleId} onOpenTask={openTask} pendingNewTask={pending.newTask} clearPending={() => setPending((p: any) => ({ ...p, newTask: false }))} /> : <div className="wrap"><Empty icon="folder" title="No project selected" sub="Create a project to start a board." action={<button className="btn btn-primary btn-sm" onClick={() => setProjModal({})}><Icon name="plus" />New project</button>} /></div>;
  else if (view === "docs") body = <DocsView projectId={projectId} />;
  else if (view === "ai") body = <AIView projectId={projectId} />;
  else if (view === "calendar") body = <CalendarView projectId={projectId} onOpenTask={openTask} />;
  else if (view === "sprint") body = <SprintView projectId={projectId} onOpenTask={openTask} />;
  else if (view === "review") body = <ReviewView onOpenTask={openTask} />;
  else if (view === "activity") body = <ActivityView projectId={projectId} />;
  else if (view === "settings") body = <SettingsView />;

  const logout = () => {
    localStorage.removeItem('devboard_pin');
    setUnlocked(false);
  };

  return (
    <div className={cx("shell", collapsed && "collapsed")}>
      {!collapsed && <Sidebar view={view} currentProject={projectId} currentModule={moduleId} nav={nav}
        onCmdK={() => setCmdkOpen(true)} onNewProject={() => setProjModal({})} onEditProject={(p) => setProjModal({ project: p })} />}
      <div className="main">
        <Topbar view={view} projectId={effectiveProject} moduleId={moduleId} nav={nav} onToggleSidebar={() => setCollapsed(c => !c)} sidebarCollapsed={collapsed} />
        <div className="content">{body}</div>
      </div>

      {openTaskId && <TaskDetail taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
      {cmdkOpen && <CommandPalette onClose={() => setCmdkOpen(false)} nav={nav} openTask={openTask} openProject={openProject}
        toggleTheme={() => Store.setMeta({ theme: state.meta?.theme === "dark" ? "light" : "dark" })} onLock={logout} />}
      {projModal && <ProjectModal project={projModal.project} onClose={() => setProjModal(null)} />}
      <ToastHost />
    </div>
  );
}

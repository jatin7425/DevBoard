'use client'
import React from 'react'
import { Icon } from '@/components/Icon'
import { useStoreFull, Store } from '@/lib/store'
import { cx } from '@/lib/utils'

interface TopbarProps {
  view: string;
  projectId: string;
  moduleId: string | null;
  nav: (v: string, opts?: any) => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function Topbar({ view, projectId, moduleId, nav, onToggleSidebar, sidebarCollapsed }: TopbarProps) {
  const state = useStoreFull();
  const theme = state.meta?.theme || "dark";
  const project = state.projects.find((p: any) => p.id === projectId);
  const mod = state.modules.find((m: any) => m.id === moduleId);
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    docs: "Docs",
    ai: "AI Planner",
    calendar: "Calendar",
    sprint: "Sprints",
    review: "Weekly Review",
    activity: "Activity",
    settings: "Settings"
  };

  return (
    <div className="topbar">
      <button className="btn-icon" onClick={onToggleSidebar} title="Toggle sidebar">
        <Icon name="sidebar" />
      </button>
      <div className="crumb">
        {view === "board" && project ? (
          <>
            <span className="proj-dot" style={{ background: project.color, width: 9, height: 9, borderRadius: 3 }} />
            <span className={mod ? "pre" : "cur"} style={{ cursor: "pointer" }} onClick={() => nav("board", { project: project.id, module: null })}>{project.name}</span>
            {mod && (
              <>
                <span className="sep"><Icon name="chevron" style={{ width: 14, verticalAlign: "-2px" }} /></span>
                <span className="cur">{mod.name}</span>
              </>
            )}
          </>
        ) : (
          <span className="cur">{titles[view] || "Board"}</span>
        )}
      </div>
      <div className="sp" />
      {view === "board" && project && (
        <div className="seg">
          <button className="on"><Icon name="board" />Board</button>
          <button onClick={() => nav("calendar", { project: project.id })}><Icon name="calendar" />Calendar</button>
        </div>
      )}
      <button className="btn-icon tip" data-tip="Toggle theme" onClick={() => Store.setMeta({ theme: theme === "dark" ? "light" : "dark" })}>
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
    </div>
  );
}

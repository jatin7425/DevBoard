'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useStoreFull } from '@/lib/store'
import { cx } from '@/lib/utils'

interface CommandPaletteProps {
  onClose: () => void;
  nav: (v: string, opts?: any) => void;
  openTask: (id: string) => void;
  openProject: (id: string) => void;
  toggleTheme: () => void;
  onLock: () => void;
}

export function CommandPalette({ onClose, nav, openTask, openProject, toggleTheme, onLock }: CommandPaletteProps) {
  const state = useStoreFull();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const actions = [
    { group: "Create", icon: "plus", label: "New task", run: () => nav("board", { newTask: true }) },
    { group: "Create", icon: "doc", label: "New doc", run: () => nav("docs", { newDoc: true }) },
    { group: "Create", icon: "folder", label: "New project", run: () => nav("dashboard", { newProject: true }) },
    { group: "Go to", icon: "home", label: "Dashboard", run: () => nav("dashboard") },
    { group: "Go to", icon: "board", label: "Board", run: () => nav("board") },
    { group: "Go to", icon: "doc", label: "Docs", run: () => nav("docs") },
    { group: "Go to", icon: "ai", label: "AI Planner", run: () => nav("ai") },
    { group: "Go to", icon: "calendar", label: "Calendar", run: () => nav("calendar") },
    { group: "Go to", icon: "sprint", label: "Sprints", run: () => nav("sprint") },
    { group: "Go to", icon: "review", label: "Weekly Review", run: () => nav("review") },
    { group: "Go to", icon: "activity", label: "Activity", run: () => nav("activity") },
    { group: "Go to", icon: "settings", label: "Settings", run: () => nav("settings") },
    { group: "Actions", icon: state.meta?.theme === "dark" ? "sun" : "moon", label: state.meta?.theme === "dark" ? "Switch to light theme" : "Switch to dark theme", run: toggleTheme },
    { group: "Actions", icon: "lock", label: "Lock app", run: onLock },
  ];

  const ql = q.toLowerCase().trim();
  let items: any[] = [];
  if (!ql) items = actions;
  else {
    items = actions.filter(a => a.label.toLowerCase().includes(ql));
    state.projects.filter((p: any) => p.name.toLowerCase().includes(ql)).slice(0, 5).forEach((p: any) =>
      items.push({ group: "Projects", icon: "folder", color: p.color, label: p.name, run: () => openProject(p.id) }));
    state.tasks.filter((t: any) => t.title.toLowerCase().includes(ql) || (t.key || "").toLowerCase().includes(ql)).slice(0, 7).forEach((t: any) =>
      items.push({ group: "Tasks", icon: "board", label: t.title, meta: t.key, run: () => openTask(t.id) }));
    state.docs.filter((d: any) => d.title.toLowerCase().includes(ql)).slice(0, 4).forEach((d: any) =>
      items.push({ group: "Docs", icon: "doc", label: d.title, run: () => nav("docs", { docId: d.id }) }));
  }

  useEffect(() => { setSel(0); }, [q]);
  const run = (it: any) => { onClose(); it.run(); };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[sel]) run(items[sel]); }
  };
  useEffect(() => { listRef.current?.querySelector(".cmdk-item.sel")?.scrollIntoView({ block: "nearest" }); }, [sel]);

  let lastGroup: string | null = null;
  return (
    <Modal open onClose={onClose} width={560} className="cmdk">
      <div className="cmdk-input">
        <Icon name="search" />
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search or jump to…" />
        <kbd>esc</kbd>
      </div>
      <div className="cmdk-list" ref={listRef}>
        {items.length === 0 && <div className="faint" style={{ padding: 24, textAlign: "center", fontSize: 13 }}>No results for “{q}”</div>}
        {items.map((it, i) => {
          const head = it.group !== lastGroup ? (lastGroup = it.group, it.group) : null;
          return (
            <React.Fragment key={i}>
              {head && <div className="cmdk-group">{head}</div>}
              <div className={cx("cmdk-item", i === sel && "sel")} onMouseEnter={() => setSel(i)} onClick={() => run(it)}>
                <span className="ci">{it.color ? <span className="cdot" style={{ background: it.color, display: "inline-block" }} /> : <Icon name={it.icon} />}</span>
                <span>{it.label}</span>
                {it.meta && <span className="meta mono">{it.meta}</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Modal>
  );
}

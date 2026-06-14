'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Icon } from '@/components/Icon'
import {
  Modal,
  Menu,
  useMenu,
  useConfirm,
  toast,
  moduleProgress,
  projectProgress
} from '@/components/ui'
import { cx, uid, PROJECT_COLORS, COLUMN_COLORS, getColumns, isTaskDone } from '@/lib/utils'
import { useStoreFull, Store } from '@/lib/store'

export function NameModal({ title, initial, onSave, onClose, label = "Name" }: { title: string; initial?: string; onSave: (v: string) => void; onClose: () => void; label?: string }) {
  const [val, setVal] = useState(initial || "");
  return (
    <Modal open onClose={onClose} width={400}>
      <div className="modal-head"><h3>{title}</h3><button className="btn-icon sm" onClick={onClose}><Icon name="x" /></button></div>
      <div className="modal-body"><div className="field"><label>{label}</label><input className="input" autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && val.trim()) { onSave(val.trim()); onClose(); } }} /></div></div>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { if (val.trim()) { onSave(val.trim()); onClose(); } }}>Save</button></div>
    </Modal>
  );
}

export function WorkflowModal({ project, onClose }: { project: any; onClose: () => void }) {
  const state = useStoreFull();
  const [cols, setCols] = useState<any[]>(() => getColumns(project).map((c: any) => ({ ...c })));
  const [colorFor, setColorFor] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    state.tasks.filter((t: any) => t.projectId === project.id).forEach((t: any) => { m[t.status] = (m[t.status] || 0) + 1; });
    return m;
  }, [state.tasks, project.id]);

  const setCol = (i: number, patch: any) => setCols(cs => cs.map((c, j) => j === i ? { ...c, ...patch } : c));
  const setDone = (i: number) => setCols(cs => cs.map((c, j) => ({ ...c, done: j === i })));
  const addCol = () => setCols(cs => [...cs, { id: uid("c_"), name: "New column", color: COLUMN_COLORS[cs.length % COLUMN_COLORS.length], done: false }]);
  const removeCol = (i: number) => setCols(cs => {
    if (cs.length <= 1) return cs;
    const next = cs.filter((_, j) => j !== i);
    if (!next.some(c => c.done)) next[next.length - 1].done = true;
    return next;
  });

  const onDrop = (i: number) => {
    setCols(cs => {
      const from = dragIdx.current; if (from == null || from === i) return cs;
      const arr = [...cs]; const [m] = arr.splice(from, 1); arr.splice(i, 0, m); return arr;
    });
    dragIdx.current = null; setOverIdx(null);
  };

  const save = () => {
    if (cols.some(c => !c.name.trim())) { toast("Every column needs a name", "error"); return; }
    Store.updateColumns(project.id, cols.map(c => ({ ...c, name: c.name.trim() })));
    toast("Workflow updated", "success"); onClose();
  };

  const orphaned = cols.length < getColumns(project).length;

  return (
    <Modal open onClose={onClose} width={540}>
      <div className="modal-head">
        <h3 className="flex aic gap8"><span className="proj-dot" style={{ background: project.color, width: 9, height: 9, borderRadius: 3 }} />Workflow · {project.name}</h3>
        <button className="btn-icon sm" onClick={onClose}><Icon name="x" /></button>
      </div>
      <div className="modal-body">
        <p className="dim" style={{ fontSize: 12.5, marginBottom: 14 }}>Drag to reorder. New tasks start in the first column. Pick which column marks a task <b style={{ color: "var(--text)" }}>complete</b> — it drives progress bars, streaks, and burndown.</p>
        <div className="wf-list">
          {cols.map((c, i) => (
            <div key={c.id} className={cx("wf-row", overIdx === i && "over")} draggable
              onDragStart={() => { dragIdx.current = i; }}
              onDragOver={(e) => { e.preventDefault(); if (i !== overIdx) setOverIdx(i); }}
              onDrop={() => onDrop(i)} onDragEnd={() => { dragIdx.current = null; setOverIdx(null); }}>
              <span className="wf-grip"><Icon name="grip" /></span>
              <div className="wf-swatch-wrap">
                <button className="wf-swatch" style={{ background: c.color }} onClick={() => setColorFor(colorFor === i ? null : i)} />
                {colorFor === i && (
                  <div className="wf-palette">
                    {COLUMN_COLORS.map(col => (
                      <button key={col} className={cx("wf-pc", c.color === col && "on")} style={{ background: col }} onClick={() => { setCol(i, { color: col }); setColorFor(null); }} />
                    ))}
                  </div>
                )}
              </div>
              <input className="input input-sm wf-name" value={c.name} onChange={(e) => setCol(i, { name: e.target.value })} placeholder="Column name" />
              <span className="wf-count">{counts[c.id] || 0}</span>
              <button className={cx("wf-done", c.done && "on")} onClick={() => setDone(i)} title="Mark as completion column">
                <Icon name="check" /><span>Done</span>
              </button>
              <button className="btn-icon sm wf-del" onClick={() => removeCol(i)} disabled={cols.length <= 1} title="Delete column"><Icon name="trash" /></button>
            </div>
          ))}
        </div>
        <button className="btn btn-default btn-sm mt12" onClick={addCol}><Icon name="plus" />Add column</button>
        {orphaned && <div className="wf-warn mt12"><Icon name="info" />Tasks in removed columns will move to <b>{cols[0]?.name}</b>.</div>}
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>Save workflow</button>
      </div>
    </Modal>
  );
}

function ModuleRow({ mod, active, onClick, onDrag, dragState, projectId }: any) {
  const state = useStoreFull();
  const prog = moduleProgress(state, mod.id);
  const count = state.tasks.filter((t: any) => t.moduleId === mod.id).length;
  const menu = useMenu();
  const [renaming, setRenaming] = useState(false);
  return (
    <>
      <div className={cx("mod-item", active && "active", dragState.over === mod.id && "drag-over")}
        draggable onDragStart={e => onDrag.start(e, mod)} onDragOver={e => onDrag.over(e, mod)} onDrop={e => onDrag.drop(e, mod)} onDragEnd={onDrag.end}
        onClick={onClick}>
        <Icon name="grip" className="mh" />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod.name}</span>
        <span className="mod-prog">{count ? `${prog}%` : "—"}</span>
        <button className="btn-icon sm more" style={{ width: 20, height: 20 }} onClick={menu.open}><Icon name="more" style={{ width: 14 }} /></button>
      </div>
      {menu.isOpen && <Menu anchor={menu.anchor} onClose={menu.close} items={[
        { icon: "edit", label: "Rename", onClick: () => setRenaming(true) },
        { sep: true },
        { icon: "trash", label: "Delete module", danger: true, onClick: () => { Store.deleteModule(mod.id); toast("Module deleted", "success"); } },
      ]} />}
      {renaming && <NameModal title="Rename module" initial={mod.name} label="Module name" onClose={() => setRenaming(false)} onSave={n => Store.updateModule(mod.id, { name: n })} />}
    </>
  );
}

function ProjectTree({ project, expanded, toggle, currentProject, currentModule, nav, onEdit }: any) {
  const state = useStoreFull();
  const modules = state.modules.filter((m: any) => m.projectId === project.id).sort((a: any, b: any) => a.order - b.order);
  const prog = projectProgress(state, project.id);
  const menu = useMenu();
  const [addMod, setAddMod] = useState(false);
  const [workflow, setWorkflow] = useState(false);
  const [confirm, confirmNode] = useConfirm();
  const dragId = useRef<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const drag = {
    start: (e: React.DragEvent, m: any) => { dragId.current = m.id; e.dataTransfer.effectAllowed = "move"; },
    over: (e: React.DragEvent, m: any) => { e.preventDefault(); if (m.id !== dragId.current) setOver(m.id); },
    drop: (e: React.DragEvent, m: any) => {
      e.preventDefault();
      const ids = modules.map((x: any) => x.id);
      const from = ids.indexOf(dragId.current || "");
      const to = ids.indexOf(m.id);
      if (from >= 0 && to >= 0) { ids.splice(to, 0, ids.splice(from, 1)[0]); Store.reorderModules(project.id, ids); }
      setOver(null); dragId.current = null;
    },
    end: () => { setOver(null); dragId.current = null; },
  };

  const del = async () => {
    if (await confirm({ title: "Delete project?", message: `“${project.name}” and all its tasks, modules, and docs will be permanently deleted.`, danger: true, confirmText: "Delete project" })) {
      Store.deleteProject(project.id); toast("Project deleted", "success"); nav("dashboard");
    }
  };

  return (
    <div className={cx("proj", expanded && "open")}>
      <div className={cx("proj-head", currentProject === project.id && "active")} onClick={() => { nav("board", { project: project.id, module: null }); if (!expanded) toggle(); }}>
        <button onClick={e => { e.stopPropagation(); toggle(); }} style={{ display: "flex" }}><Icon name="chevron" className="chev" /></button>
        <span className="proj-dot" style={{ background: project.color }} />
        <span className="proj-name">{project.name}</span>
        <span className="mod-prog" style={{ fontSize: 10.5, color: "var(--text-4)" }}>{prog}%</span>
        <button className="btn-icon sm more" style={{ width: 20, height: 20 }} onClick={menu.open}><Icon name="more" style={{ width: 14 }} /></button>
      </div>
      {expanded && (
        <div className="mods">
          {modules.map((m: any) => (
            <ModuleRow key={m.id} mod={m} projectId={project.id} active={currentProject === project.id && currentModule === m.id}
              onClick={() => nav("board", { project: project.id, module: m.id })} onDrag={drag} dragState={{ over }} />
          ))}
          <div className="mod-item" style={{ color: "var(--text-3)", cursor: "pointer" }} onClick={() => setAddMod(true)}><Icon name="plus" style={{ width: 13, height: 13 }} /><span>Add module</span></div>
        </div>
      )}
      {menu.isOpen && <Menu anchor={menu.anchor} onClose={menu.close} items={[
        { icon: "edit", label: "Edit project", onClick: () => onEdit(project) },
        { icon: "board", label: "Edit workflow", onClick: () => setWorkflow(true) },
        { icon: "cube", label: "Add module", onClick: () => setAddMod(true) },
        { icon: "archive", label: project.archived ? "Unarchive" : "Archive", onClick: () => { Store.archiveProject(project.id, !project.archived); toast(project.archived ? "Unarchived" : "Archived", "success"); } },
        { sep: true },
        { icon: "trash", label: "Delete project", danger: true, onClick: del },
      ]} />}
      {addMod && <NameModal title="Add module" label="Module name" onClose={() => setAddMod(false)} onSave={n => { Store.addModule(project.id, n); toast("Module added", "success"); if (!expanded) toggle(); }} />}
      {workflow && <WorkflowModal project={project} onClose={() => setWorkflow(false)} />}
      {confirmNode}
    </div>
  );
}

interface SidebarProps {
  view: string;
  currentProject: string;
  currentModule: string | null;
  nav: (v: string, opts?: any) => void;
  onCmdK: () => void;
  onNewProject: () => void;
  onEditProject: (p: any) => void;
}

export function Sidebar({ view, currentProject, currentModule, nav, onCmdK, onNewProject, onEditProject }: SidebarProps) {
  const state = useStoreFull();
  const projects = state.projects.filter((p: any) => !p.archived).sort((a: any, b: any) => a.order - b.order);
  const archived = state.projects.filter((p: any) => p.archived);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(projects.slice(0, 1).map((p: any) => p.id)));
  const [showArchived, setShowArchived] = useState(false);
  const toggle = (id: string) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const navItems = [
    { view: "dashboard", icon: "home", label: "Dashboard" },
    { view: "calendar", icon: "calendar", label: "Calendar" },
    { view: "review", icon: "review", label: "Weekly Review" },
    { view: "activity", icon: "activity", label: "Activity" },
  ];
  const toolItems = [
    { view: "docs", icon: "doc", label: "Docs" },
    { view: "ai", icon: "ai", label: "AI Planner" },
    { view: "sprint", icon: "sprint", label: "Sprints" },
  ];

  return (
    <div className="sidebar">
      <div className="sb-top">
        <div className="logo"><Icon name="zap" /></div>
        <div className="brand">Forge<small>Personal Jira</small></div>
      </div>
      <div className="sb-search">
        <button onClick={onCmdK}><Icon name="search" /><span>Search…</span><kbd>⌘K</kbd></button>
      </div>
      <div className="sb-scroll">
        <div className="nav-sec">
          {navItems.map(it => (
            <div key={it.view} className={cx("nav-item", view === it.view && currentProject === "all" && "active")} onClick={() => nav(it.view, { project: "all", module: null })}>
              <Icon name={it.icon} /><span>{it.label}</span>
            </div>
          ))}
        </div>
        <div className="nav-sec">
          <div className="nav-label">Tools</div>
          {toolItems.map(it => (
            <div key={it.view} className={cx("nav-item", view === it.view && currentProject === "all" && "active")} onClick={() => nav(it.view, { project: "all", module: null })}>
              <Icon name={it.icon} /><span>{it.label}</span>
            </div>
          ))}
        </div>
        <div className="nav-sec">
          <div className="nav-label">Projects<button onClick={onNewProject} title="New project"><Icon name="plus" style={{ width: 14 }} /></button></div>
          {projects.map((p: any) => (
            <ProjectTree key={p.id} project={p} expanded={expanded.has(p.id)} toggle={() => toggle(p.id)}
              currentProject={currentProject} currentModule={currentModule} nav={nav} onEdit={onEditProject} />
          ))}
          {projects.length === 0 && <div className="faint" style={{ fontSize: 12, padding: "6px 10px" }}>No projects. <a style={{ color: "var(--accent)", cursor: "pointer" }} onClick={onNewProject}>Create one</a></div>}
          {archived.length > 0 && (
            <>
              <div className="nav-item" style={{ color: "var(--text-3)", fontSize: 12.5 }} onClick={() => setShowArchived(s => !s)}>
                <Icon name="archive" /><span>Archived</span><span className="count">{archived.length}</span>
              </div>
              {showArchived && archived.sort((a: any, b: any) => a.order - b.order).map((p: any) => (
                <ProjectTree key={p.id} project={p} expanded={expanded.has(p.id)} toggle={() => toggle(p.id)}
                  currentProject={currentProject} currentModule={currentModule} nav={nav} onEdit={onEditProject} />
              ))}
            </>
          )}
        </div>
      </div>
      <div className="sb-foot">
        <div className="who"><div className="avatar">DV</div><div style={{ minWidth: 0 }}><div className="nm">Dev Workspace</div><div className="st">Local · {state.tasks.filter((t: any) => !isTaskDone(state, t)).length} open</div></div></div>
        <button className="btn-icon sm" title="Settings" onClick={() => nav("settings", { project: "all" })}><Icon name="settings" /></button>
      </div>
    </div>
  );
}

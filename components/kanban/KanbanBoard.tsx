'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Icon } from '@/components/Icon'
import {
  Modal,
  Empty,
  Progress,
  PriorityBadge,
  useMenu,
  Menu,
  toast,
  Tag
} from '@/components/ui'
import { WorkflowModal } from '@/components/Sidebar'
import {
  cx,
  uid,
  fmtDate,
  dueState,
  fmtDuration,
  getColumns,
  getColumn,
  isDoneStatus,
  firstStatus,
  PRIORITY,
  PROJECT_COLORS
} from '@/lib/utils'
import { useStoreFull, Store } from '@/lib/store'

/* -------------------- TaskCard -------------------- */
export function TaskCard({ task, done, onOpen, dragging, dragOverPos, onDragStart, onDragEnd, onCardDragOver }: any) {
  const subDone = task.subtasks?.filter((s: any) => s.done).length || 0;
  const st = dueState(task.dueDate, done);
  return (
    <div
      className={cx("tcard", dragging && "dragging", dragOverPos === "top" && "drag-over-top", dragOverPos === "bot" && "drag-over-bot")}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onCardDragOver(e, task)}
      onClick={() => onOpen(task.id)}
    >
      {task.tags?.length > 0 && (
        <div className="tags-row">{task.tags.slice(0, 4).map((t: any) => <Tag key={t}>{t}</Tag>)}</div>
      )}
      <div className="ttitle" style={done ? { color: "var(--text-2)" } : undefined}>{task.title}</div>
      <div className="tfoot">
        <PriorityBadge priority={task.priority} withLabel={false} />
        {task.dueDate && <span className={cx("due", st)}><Icon name={st === "over" ? "alert" : "calendar"} />{fmtDate(task.dueDate)}</span>}
        {task.subtasks?.length > 0 && (
          <span className="sub-prog"><Icon name="check" />{subDone}/{task.subtasks.length}</span>
        )}
        {task.timeSpent > 0 && <span className="timew"><Icon name="clock" style={{ width: 12, height: 12 }} />{fmtDuration(task.timeSpent)}</span>}
        <span style={{ marginLeft: "auto" }} className="id">{task.key}</span>
      </div>
    </div>
  );
}

/* -------------------- QuickAdd -------------------- */
function QuickAdd({ status, projectId, moduleId, onDone }: any) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const submit = () => {
    if (val.trim()) { Store.addTask({ projectId, moduleId: moduleId || null, status, title: val.trim() }); toast("Task created", "success"); }
    setVal(""); onDone();
  };
  return (
    <div className="tcard" style={{ cursor: "default" }}>
      <textarea ref={ref} className="td-title" style={{ fontSize: 13, fontWeight: 500, minHeight: 38 }}
        placeholder="Task title…" value={val} rows={2}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } if (e.key === "Escape") onDone(); }}
        onBlur={() => { if (!val.trim()) onDone(); }} />
      <div className="flex aic gap8 mt8">
        <button className="btn btn-primary btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={submit}>Add</button>
        <button className="btn btn-ghost btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

/* -------------------- Board -------------------- */
export function Board({ projectId, moduleId, onOpenTask, search, filters }: any) {
  const state = useStoreFull();
  const project = state.projects.find((p: any) => p.id === projectId);
  const columns = getColumns(project);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ status: string | null; beforeId: string | null; overCard?: string | null; half?: "top" | "bot" }>({ status: null, beforeId: null });
  const [quickAdd, setQuickAdd] = useState<string | null>(null);
  const [editWorkflow, setEditWorkflow] = useState(false);

  const tasks = useMemo(() => {
    let list = state.tasks.filter((t: any) => t.projectId === projectId);
    if (moduleId) list = list.filter((t: any) => t.moduleId === moduleId);
    if (search) { const q = search.toLowerCase(); list = list.filter((t: any) => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || t.tags?.some((tag: string) => tag.toLowerCase().includes(q)) || (t.key || "").toLowerCase().includes(q)); }
    if (filters.priority.length) list = list.filter((t: any) => filters.priority.includes(t.priority));
    if (filters.tags.length) list = list.filter((t: any) => t.tags?.some((tag: string) => filters.tags.includes(tag)));
    return list;
  }, [state.tasks, projectId, moduleId, search, filters]);

  const byStatus = useMemo(() => {
    const g: Record<string, any[]> = {}; columns.forEach((c: any) => g[c.id] = []);
    const fallback = columns[0]?.id;
    tasks.forEach((t: any) => { (g[t.status] || g[fallback] || (g[fallback] = [])).push(t); });
    Object.values(g).forEach(arr => arr.sort((a, b) => a.order - b.order));
    return g;
  }, [tasks, columns]);

  const onDragStart = (e: React.DragEvent, task: any) => { setDraggingId(task.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", task.id); };
  const onDragEnd = () => { setDraggingId(null); setDragOver({ status: null, beforeId: null }); };

  const onCardDragOver = (e: React.DragEvent, task: any) => {
    e.preventDefault(); e.stopPropagation();
    if (task.id === draggingId) return;
    const r = e.currentTarget.getBoundingClientRect();
    const isTop = e.clientY < r.top + r.height / 2;
    const col = byStatus[task.status] || [];
    const idx = col.findIndex(t => t.id === task.id);
    const beforeId = isTop ? task.id : (col[idx + 1]?.id || null);
    setDragOver({ status: task.status, beforeId, overCard: task.id, half: isTop ? "top" : "bot" });
  };
  const onColDragOver = (e: React.DragEvent, status: string) => { e.preventDefault(); if (!dragOver.overCard || dragOver.status !== status) setDragOver({ status, beforeId: null, overCard: null }); };
  const onColDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggingId) Store.moveTask(draggingId, status, dragOver.status === status ? dragOver.beforeId : null);
    onDragEnd();
  };

  const total = tasks.length;
  const doneCount = tasks.filter((t: any) => isDoneStatus(project, t.status)).length;
  const firstId = columns[0]?.id;
  const activeCount = tasks.filter((t: any) => !isDoneStatus(project, t.status) && t.status !== firstId).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="board-bar">
        <button className="btn btn-ghost btn-sm" onClick={() => setEditWorkflow(true)}><Icon name="settings" />Workflow</button>
        <div className="flex aic gap8" style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text-3)" }}>
          <span><b style={{ color: "var(--text)" }}>{total}</b> tasks</span>
          <span className="mdot">·</span>
          <span><b style={{ color: "var(--s-prog)" }}>{activeCount}</b> in progress</span>
          <span className="mdot">·</span>
          <span><b style={{ color: "var(--s-done)" }}>{doneCount}</b> done</span>
        </div>
      </div>
      <div className="board">
        {columns.map((col: any) => (
          <div key={col.id} className={cx("col", dragOver.status === col.id && !dragOver.overCard && draggingId && "drag-over")}
            onDragOver={(e) => onColDragOver(e, col.id)} onDrop={(e) => onColDrop(e, col.id)}>
            <div className="col-head">
              <span className="sdot" style={{ background: col.color }} />
              <span className="ctitle">{col.name}{col.done && <Icon name="check" style={{ width: 12, height: 12, marginLeft: 4, color: "var(--s-done)", verticalAlign: "-1px" }} />}</span>
              <span className="cnum">{(byStatus[col.id] || []).length}</span>
              <button className="add" onClick={() => setQuickAdd(col.id)}><Icon name="plus" /></button>
            </div>
            <div className="col-body">
              {(byStatus[col.id] || []).map((task: any) => (
                <TaskCard key={task.id} task={task} done={col.done} onOpen={onOpenTask}
                  dragging={draggingId === task.id}
                  dragOverPos={dragOver.overCard === task.id ? (dragOver.half === "top" ? "top" : "bot") : null}
                  onDragStart={onDragStart} onDragEnd={onDragEnd} onCardDragOver={onCardDragOver} />
              ))}
              {quickAdd === col.id && <QuickAdd status={col.id} projectId={projectId} moduleId={moduleId} onDone={() => setQuickAdd(null)} />}
              {(byStatus[col.id] || []).length === 0 && quickAdd !== col.id && (
                <button className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start", color: "var(--text-3)" }} onClick={() => setQuickAdd(col.id)}>
                  <Icon name="plus" /> Add task
                </button>
              )}
            </div>
          </div>
        ))}
        <button className="col-add" onClick={() => setEditWorkflow(true)} title="Add a column">
          <Icon name="plus" /><span>Add column</span>
        </button>
      </div>
      {editWorkflow && <WorkflowModal project={project} onClose={() => setEditWorkflow(false)} />}
    </div>
  );
}

/* -------------------- BoardHeader -------------------- */
function BoardHeader({ projectId, moduleId, search, setSearch, filters, setFilters, onNewTask }: any) {
  const state = useStoreFull();
  const allTags = useMemo(() => {
    const s = new Set<string>();
    state.tasks.filter((t: any) => t.projectId === projectId).forEach((t: any) => t.tags?.forEach((tag: string) => s.add(tag)));
    return Array.from(s).sort();
  }, [state.tasks, projectId]);
  const prioMenu = useMenu(), tagMenu = useMenu();
  const togglePrio = (p: string) => setFilters((f: any) => ({ ...f, priority: f.priority.includes(p) ? f.priority.filter((x: string) => x !== p) : [...f.priority, p] }));
  const toggleTag = (t: string) => setFilters((f: any) => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x: string) => x !== t) : [...f.tags, t] }));
  const activeFilters = filters.priority.length + filters.tags.length;

  return (
    <div className="board-bar">
      <div className="search-box">
        <Icon name="search" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" />
        {search && <button className="btn-icon sm" style={{ width: 20, height: 20 }} onClick={() => setSearch("")}><Icon name="x" style={{ width: 13 }} /></button>}
      </div>
      <button className={cx("filter-pill", filters.priority.length && "on")} onClick={prioMenu.open}><Icon name="flag" />Priority{filters.priority.length > 0 && ` · ${filters.priority.length}`}</button>
      {prioMenu.isOpen && <Menu anchor={prioMenu.anchor} onClose={prioMenu.close} items={Object.keys(PRIORITY).map(p => ({
        icon: filters.priority.includes(p) ? "check" : "flag", label: PRIORITY[p].label, onClick: () => { togglePrio(p); } }))} />}
      <button className={cx("filter-pill", filters.tags.length && "on")} onClick={tagMenu.open}><Icon name="tag" />Tags{filters.tags.length > 0 && ` · ${filters.tags.length}`}</button>
      {tagMenu.isOpen && <Menu anchor={tagMenu.anchor} onClose={tagMenu.close} items={allTags.length ? allTags.map(t => ({
        icon: filters.tags.includes(t) ? "check" : "tag", label: t, onClick: () => toggleTag(t) })) : [{ label: "No tags yet" }]} />}
      {activeFilters > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ priority: [], tags: [] })}>Clear</button>}
      <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={onNewTask}><Icon name="plus" />New task</button>
    </div>
  );
}

/* -------------------- NewTaskModal -------------------- */
export function NewTaskModal({ projectId, moduleId, onClose, onCreated }: any) {
  const state = useStoreFull();
  const project = state.projects.find((p: any) => p.id === projectId);
  const columns = getColumns(project);
  const mods = state.modules.filter((m: any) => m.projectId === projectId).sort((a: any, b: any) => a.order - b.order);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState(columns[0]?.id || "todo");
  const [mod, setMod] = useState(moduleId || "");
  const [due, setDue] = useState("");
  const create = (openAfter: boolean) => {
    if (!title.trim()) return toast("Title is required", "error");
    const t = Store.addTask({ projectId, moduleId: mod || null, title: title.trim(), priority, status, dueDate: due ? new Date(due + "T12:00").getTime() : null });
    toast("Task created", "success"); onClose();
    if (openAfter) onCreated(t.id);
  };
  return (
    <Modal open onClose={onClose} width={500}>
      <div className="modal-head"><h3>New task</h3><button className="btn-icon sm" onClick={onClose}><Icon name="x" /></button></div>
      <div className="modal-body">
        <div className="field mb16"><label>Title</label><input className="input" autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs doing?" onKeyDown={e => e.key === "Enter" && create(false)} /></div>
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field"><label>Status</label><select className="select" value={status} onChange={e => setStatus(e.target.value)}>{columns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Priority</label><select className="select" value={priority} onChange={e => setPriority(e.target.value)}>{Object.keys(PRIORITY).map(p => <option key={p} value={p}>{PRIORITY[p].label}</option>)}</select></div>
          <div className="field"><label>Module</label><select className="select" value={mod} onChange={e => setMod(e.target.value)}><option value="">— None —</option>{mods.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <div className="field"><label>Due date</label><input type="date" className="input" value={due} onChange={e => setDue(e.target.value)} /></div>
        </div>
      </div>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-default" onClick={() => create(true)}>Create & open</button><button className="btn btn-primary" onClick={() => create(false)}>Create</button></div>
    </Modal>
  );
}

/* -------------------- BoardPage -------------------- */
export function KanbanBoard({ projectId, moduleId, onOpenTask, pendingNewTask, clearPending }: any) {
  const state = useStoreFull();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ priority: [] as string[], tags: [] as string[] });
  const [newTask, setNewTask] = useState(false);
  useEffect(() => { if (pendingNewTask) { setNewTask(true); clearPending(); } }, [pendingNewTask, clearPending]);

  const project = state.projects.find((p: any) => p.id === projectId);
  if (!project) return <Empty icon="folder" title="Project not found" sub="Pick a project from the sidebar." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <BoardHeader projectId={projectId} moduleId={moduleId} search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} onNewTask={() => setNewTask(true)} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Board projectId={projectId} moduleId={moduleId} onOpenTask={onOpenTask} search={search} filters={filters} />
      </div>
      {newTask && <NewTaskModal projectId={projectId} moduleId={moduleId} onClose={() => setNewTask(false)} onCreated={onOpenTask} />}
    </div>
  );
}

'use client'
import React from 'react'
import {
  uid,
  DAY,
  fmtDateInput,
  firstStatus,
  isDoneStatus,
  defaultColumns,
  getColumns,
  PROJECT_COLORS
} from '@/lib/utils'

export const LS_KEY = "pj_state_v1";

export function seedState() {
  const now = Date.now();
  const d = (offset: number) => now + offset * DAY;
  const p1 = uid("p_"), p2 = uid("p_"), p3 = uid("p_"), p4 = uid("p_");
  const projects = [
    { id: p1, name: "Personal Jira", description: "The self-hosted project tracker you're looking at. Dogfooding the roadmap, one module at a time.", color: "#f97316", archived: false, order: 0, columns: defaultColumns(), createdAt: d(-44), updatedAt: d(-0.1) },
    { id: p2, name: "Inboxly", description: "Indie SaaS — a calm email client with AI triage. Pre-launch, building toward a public beta.", color: "#3b82f6", archived: false, order: 1, columns: [
      { id: "todo", name: "Backlog", color: "#8b8b94", done: false },
      { id: "progress", name: "Building", color: "#3b82f6", done: false },
      { id: "review", name: "Code Review", color: "#a855f7", done: false },
      { id: "qa", name: "QA", color: "#f59e0b", done: false },
      { id: "done", name: "Shipped", color: "#22c55e", done: true },
    ], createdAt: d(-70), updatedAt: d(-1.2) },
    { id: p3, name: "Portfolio v3", description: "Personal site rebuild. Static, fast, with a writing section and case studies.", color: "#22c55e", archived: false, order: 2, columns: defaultColumns(), createdAt: d(-21), updatedAt: d(-3) },
    { id: p4, name: "Recipe App (paused)", description: "Weekend experiment. Shelved for now.", color: "#a855f7", archived: true, order: 3, columns: defaultColumns(), createdAt: d(-120), updatedAt: d(-60) },
  ];
  const M = (projectId: string, name: string, order: number) => ({ id: uid("m_"), projectId, name, order });
  const m_core = M(p1, "Core App", 0), m_board = M(p1, "Kanban", 1), m_ai = M(p1, "AI Tools", 2);
  const m_auth = M(p2, "Auth & Billing", 0), m_triage = M(p2, "AI Triage", 1), m_infra = M(p2, "Infra", 2);
  const m_site = M(p3, "Pages", 0), m_writing = M(p3, "Writing", 1);
  const modules = [m_core, m_board, m_ai, m_auth, m_triage, m_infra, m_site, m_writing];

  let seq: Record<string, number> = {};
  const key = (pid: string) => {
    const proj = projects.find(p => p.id === pid);
    if (!proj) return "TSK";
    return proj.name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 3);
  };
  const mkKey = (pid: string) => { const k = key(pid); seq[k] = (seq[k] || 0) + 1; return `${k}-${seq[k]}`; };

  const T = (o: any) => ({
    id: uid("t_"), key: mkKey(o.projectId), tags: [], subtasks: [], timeSpent: 0,
    description: "", priority: "medium", dueDate: null, completedAt: null, sprintId: null,
    createdAt: d(-10), updatedAt: d(-2), order: 0, ...o,
  });
  const sub = (text: string, done: boolean) => ({ id: uid("s_"), text, done });

  const tasks = [
    // Personal Jira
    T({ projectId: p1, moduleId: m_board.id, status: "done", priority: "high", title: "Drag & drop across columns", tags: ["board", "dnd"], order: 0, completedAt: d(-6), timeSpent: 9300,
        description: "Implement HTML5 drag and drop.\n\n- [x] Column drop targets\n- [x] Reorder within column\n- [x] Visual drop indicators", 
        subtasks: [sub("Column drop targets", true), sub("Reorder within column", true), sub("Visual indicators", true)] }),
    T({ projectId: p1, moduleId: m_core.id, status: "done", priority: "critical", title: "Pincode lock screen", tags: ["auth", "security"], order: 1, completedAt: d(-9), timeSpent: 5400 }),
    T({ projectId: p1, moduleId: m_board.id, status: "progress", priority: "high", title: "Task detail: subtasks + time tracking", tags: ["board"], order: 0, dueDate: d(1), timeSpent: 4200,
        description: "Add a **pomodoro timer** and checklist to the task drawer.\n\n```\nUse requestAnimationFrame? No — setInterval is fine.\n```",
        subtasks: [sub("Checklist UI", true), sub("Pomodoro timer", true), sub("Persist time spent", false), sub("Daily total roll-up", false)] }),
    T({ projectId: p1, moduleId: m_ai.id, status: "progress", priority: "medium", title: "Wire AI planning prompt to live model", tags: ["ai"], order: 1, dueDate: d(3), timeSpent: 1800,
        subtasks: [sub("Prompt template", true), sub("Parse markdown response", false)] }),
    T({ projectId: p1, moduleId: m_core.id, status: "review", priority: "medium", title: "Command palette (Cmd+K)", tags: ["ux", "shortcuts"], order: 0, timeSpent: 3600 }),
    T({ projectId: p1, moduleId: m_core.id, status: "todo", priority: "low", title: "Empty states for every page", tags: ["ux", "polish"], order: 0 }),
    T({ projectId: p1, moduleId: m_board.id, status: "todo", priority: "high", title: "Saved board filters & swimlanes", tags: ["board"], order: 1, dueDate: d(-1) }),
    T({ projectId: p1, moduleId: m_core.id, status: "todo", priority: "medium", title: "Loading skeletons on first paint", tags: ["ux"], order: 2 }),

    // Inboxly
    T({ projectId: p2, moduleId: m_triage.id, status: "progress", priority: "critical", title: "Streaming AI triage classifier", tags: ["ai", "backend"], order: 0, dueDate: d(2), timeSpent: 14400,
        description: "Classify incoming mail into **Now / Later / FYI** with a small model.\n\n> Latency budget: < 400ms p95",
        subtasks: [sub("Prompt + few-shot set", true), sub("Streaming response", true), sub("Confidence threshold", false)] }),
    T({ projectId: p2, moduleId: m_auth.id, status: "done", priority: "high", title: "Stripe subscription webhooks", tags: ["billing"], order: 0, completedAt: d(-4), timeSpent: 10800 }),
    T({ projectId: p2, moduleId: m_auth.id, status: "review", priority: "high", title: "Magic-link sign in", tags: ["auth"], order: 0, timeSpent: 7200 }),
    T({ projectId: p2, moduleId: m_infra.id, status: "todo", priority: "high", title: "Edge caching for inbox list", tags: ["infra", "perf"], order: 0, dueDate: d(5) }),
    T({ projectId: p2, moduleId: m_infra.id, status: "todo", priority: "critical", title: "Migrate queue to durable workers", tags: ["infra"], order: 1, dueDate: d(-2) }),
    T({ projectId: p2, moduleId: m_triage.id, status: "todo", priority: "medium", title: "Snooze + remind-later flow", tags: ["feature"], order: 2 }),
    T({ projectId: p2, moduleId: m_auth.id, status: "done", priority: "low", title: "GDPR data export endpoint", tags: ["billing", "legal"], order: 1, completedAt: d(-12) }),

    // Portfolio
    T({ projectId: p3, moduleId: m_site.id, status: "progress", priority: "medium", title: "Case study layout + MDX", tags: ["design"], order: 0, dueDate: d(4), timeSpent: 5400 }),
    T({ projectId: p3, moduleId: m_writing.id, status: "todo", priority: "low", title: "Write 'Why I built my own Jira'", tags: ["writing"], order: 0, dueDate: d(7) }),
    T({ projectId: p3, moduleId: m_site.id, status: "done", priority: "medium", title: "Dark mode + theme toggle", tags: ["design"], order: 1, completedAt: d(-2) }),
    T({ projectId: p3, moduleId: m_site.id, status: "review", priority: "low", title: "Lighthouse pass (perf 100)", tags: ["perf"], order: 0 }),
  ];

  // Sprint on Inboxly
  const sprintId = uid("sp_");
  const sprintTasks = tasks.filter(t => t.projectId === p2);
  sprintTasks.forEach(t => t.sprintId = sprintId);
  const sprints = [{
    id: sprintId, projectId: p2, name: "Beta Sprint 4", goal: "Ship triage + billing for closed beta",
    startDate: d(-8), endDate: d(6), taskIds: sprintTasks.map(t => t.id),
  }];

  const docs = [
    { id: uid("d_"), projectId: p1, title: "Architecture Notes", createdAt: d(-30), updatedAt: d(-2),
      content: "# Architecture\n\nEverything is a **single-page app** persisted to `localStorage`. No backend.\n\n## Data model\n\n- `projects` → `modules` → `tasks`\n- `docs` live under a project\n- `sprints` group tasks for burndown\n\n## Principles\n\n1. Keyboard-first\n2. Offline-always\n3. One keystroke from anywhere via `Cmd+K`\n\n> If it needs a server, it doesn't belong in v1." },
    { id: uid("d_"), projectId: p1, title: "Roadmap", createdAt: d(-25), updatedAt: d(-5),
      content: "# Roadmap\n\n## Now\n- [x] Kanban + DnD\n- [ ] AI planning import\n- [ ] Sprints & burndown\n\n## Next\n- Calendar view\n- Weekly review ritual\n\n## Someday\n- Mobile PWA\n- Multi-device sync" },
    { id: uid("d_"), projectId: p2, title: "Beta Launch Checklist", createdAt: d(-10), updatedAt: d(-1),
      content: "# Beta Launch Checklist\n\n- [x] Auth\n- [x] Billing\n- [ ] Triage accuracy > 90%\n- [ ] Onboarding emails\n- [ ] Status page\n\n## Comms\n\nDraft the launch tweet and the waitlist email. Keep it **short**." },
  ];

  const activity = [
    { id: uid("a_"), ts: d(-0.1), type: "task", text: "Moved “Drag & drop across columns” to Done", projectId: p1 },
    { id: uid("a_"), ts: d(-0.5), type: "task", text: "Started timer on “Task detail: subtasks + time tracking”", projectId: p1 },
    { id: uid("a_"), ts: d(-1.2), type: "doc", text: "Edited “Beta Launch Checklist”", projectId: p2 },
    { id: uid("a_"), ts: d(-2), type: "task", text: "Created “Snooze + remind-later flow”", projectId: p2 },
    { id: uid("a_"), ts: d(-3), type: "project", text: "Created project “Portfolio v3”", projectId: p3 },
  ];

  return {
    meta: {
      version: 1, theme: "dark", pincode: "424242", lastReview: null,
      streak: 4, streakDays: {} as Record<string, number>, lastActiveDay: fmtDateInput(now), autoLockMin: 5,
    },
    projects, modules, tasks, docs, sprints, activity,
    ui: { lastProject: p1, lastModule: null as string | null },
  };
}

let syncTimeout: any = null;
function getPin(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('devboard_pin') || '';
}

export const Store = {
  state: null as any,
  listeners: new Set<() => void>(),

  async load(onLoaded?: () => void) {
    // 1. Try local storage first
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
        this.migrate();
        if (onLoaded) onLoaded();
      }
    } catch (e) {
      console.warn("load local failed", e);
    }

    // 2. Fetch fresh state from MongoDB
    try {
      const res = await fetch('/api/store', {
        headers: { 'x-devboard-pin': getPin() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.projects) {
          this.state = data;
          this.migrate();
          try { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); } catch(e){}
          this.emit();
          if (onLoaded) onLoaded();
          return;
        }
      }
    } catch (e) {
      console.warn("load remote failed", e);
    }

    // 3. Fallback to seed state
    if (!this.state) {
      this.state = seedState();
      this.persist();
      if (onLoaded) onLoaded();
    }
  },

  migrate() {
    let changed = false;
    if (!this.state) return;
    if (!this.state.meta) {
      this.state.meta = {
        version: 1, theme: "dark", pincode: "424242", lastReview: null,
        streak: 4, streakDays: {}, lastActiveDay: fmtDateInput(Date.now()), autoLockMin: 5,
      };
      changed = true;
    } else {
      if (typeof this.state.meta !== 'object') {
        this.state.meta = {};
      }
      if (typeof this.state.meta.streakDays !== 'object' || this.state.meta.streakDays === null) {
        this.state.meta.streakDays = {};
        changed = true;
      }
      if (this.state.meta.streak === undefined) {
        this.state.meta.streak = 4;
        changed = true;
      }
      if (this.state.meta.autoLockMin === undefined) {
        this.state.meta.autoLockMin = 5;
        changed = true;
      }
    }
    
    if (!Array.isArray(this.state.projects)) { this.state.projects = []; changed = true; }
    if (!Array.isArray(this.state.modules)) { this.state.modules = []; changed = true; }
    if (!Array.isArray(this.state.tasks)) { this.state.tasks = []; changed = true; }
    if (!Array.isArray(this.state.docs)) { this.state.docs = []; changed = true; }
    if (!Array.isArray(this.state.sprints)) { this.state.sprints = []; changed = true; }
    if (!Array.isArray(this.state.activity)) { this.state.activity = []; changed = true; }

    (this.state.tasks || []).forEach((t: any) => {
      if (!Array.isArray(t.comments)) { t.comments = []; changed = true; }
    });

    (this.state.projects || []).forEach((p: any) => {
      if (!Array.isArray(p.columns) || !p.columns.length) { p.columns = defaultColumns(); changed = true; }
    });
    if (changed) this.persist();
  },

  persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.state));

      // Debounced backend sync
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(async () => {
        try {
          await fetch('/api/store', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-devboard-pin': getPin()
            },
            body: JSON.stringify(this.state)
          });
        } catch (err) {
          console.error("MongoDB sync failed", err);
        }
      }, 800);
    } catch (e) {
      console.warn("persist failed", e);
    }
  },

  emit() { this.listeners.forEach(l => l()); },
  sub(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  set(updater: any) {
    this.state = typeof updater === "function" ? updater(this.state) : updater;
    this.persist(); this.emit();
  },
  get() { return this.state; },

  logActivity(type: string, text: string, projectId: string) {
    this.state.activity.unshift({ id: uid("a_"), ts: Date.now(), type, text, projectId });
    this.state.activity = this.state.activity.slice(0, 120);
  },
  markActiveToday() {
    const today = fmtDateInput(Date.now());
    if (!this.state.meta) {
      this.state.meta = {
        version: 1, theme: "dark", pincode: "424242", lastReview: null,
        streak: 1, streakDays: {}, lastActiveDay: today, autoLockMin: 5,
      };
    }
    const m = this.state.meta;
    m.streakDays = m.streakDays || {};
    m.streakDays[today] = (m.streakDays[today] || 0) + 1;
  },

  /* ---- projects ---- */
  addProject({ name, description, color }: { name: string; description?: string; color?: string }) {
    const order = Math.max(-1, ...this.state.projects.map((p: any) => p.order)) + 1;
    const p = { id: uid("p_"), name, description: description || "", color: color || PROJECT_COLORS[0], archived: false, order, columns: defaultColumns(), createdAt: Date.now(), updatedAt: Date.now() };
    this.set((s: any) => { s.projects = [...s.projects, p]; this.logActivity("project", `Created project “${name}”`, p.id); return { ...s }; });
    return p;
  },
  updateProject(id: string, patch: any) {
    this.set((s: any) => { const p = s.projects.find((x: any) => x.id === id); if (p) Object.assign(p, patch, { updatedAt: Date.now() }); s.projects = [...s.projects]; return { ...s }; });
  },
  deleteProject(id: string) {
    this.set((s: any) => {
      s.projects = s.projects.filter((p: any) => p.id !== id);
      s.modules = s.modules.filter((m: any) => m.projectId !== id);
      s.tasks = s.tasks.filter((t: any) => t.projectId !== id);
      s.docs = s.docs.filter((dc: any) => dc.projectId !== id);
      s.sprints = s.sprints.filter((sp: any) => sp.projectId !== id);
      return { ...s };
    });
  },
  archiveProject(id: string, archived: boolean) { this.updateProject(id, { archived }); },
  reorderProjects(ids: string[]) {
    this.set((s: any) => { ids.forEach((id, i) => { const p = s.projects.find((x: any) => x.id === id); if (p) p.order = i; }); s.projects = [...s.projects]; return { ...s }; });
  },
  updateColumns(projectId: string, columns: any[]) {
    this.set((s: any) => {
      const p = s.projects.find((x: any) => x.id === projectId); if (!p) return s;
      let cols = columns.map(c => ({ ...c }));
      if (!cols.some(c => c.done)) cols[cols.length - 1].done = true;
      const validIds = new Set(cols.map(c => c.id));
      const fallback = cols[0].id;
      s.tasks.forEach((t: any) => { if (t.projectId === projectId && !validIds.has(t.status)) { t.status = fallback; t.updatedAt = Date.now(); } });
      p.columns = cols; p.updatedAt = Date.now();
      this.logActivity("project", `Updated workflow for “${p.name}”`, projectId);
      s.projects = [...s.projects];
      s.tasks = [...s.tasks];
      return { ...s };
    });
  },

  /* ---- modules ---- */
  addModule(projectId: string, name: string) {
    const order = Math.max(-1, ...this.state.modules.filter((m: any) => m.projectId === projectId).map((m: any) => m.order)) + 1;
    const m = { id: uid("m_"), projectId, name, order };
    this.set((s: any) => { s.modules = [...s.modules, m]; this.logActivity("module", `Added module “${name}”`, projectId); return { ...s }; });
    return m;
  },
  updateModule(id: string, patch: any) { this.set((s: any) => { const m = s.modules.find((x: any) => x.id === id); if (m) Object.assign(m, patch); s.modules = [...s.modules]; return { ...s }; }); },
  deleteModule(id: string) {
    this.set((s: any) => {
      const m = s.modules.find((x: any) => x.id === id);
      s.modules = s.modules.filter((x: any) => x.id !== id);
      if (m) this.logActivity("module", `Deleted module “${m.name}”`, m.projectId);
      s.tasks = s.tasks.filter((t: any) => t.moduleId !== id);
      return { ...s };
    });
  },
  reorderModules(projectId: string, ids: string[]) {
    this.set((s: any) => { ids.forEach((id, i) => { const m = s.modules.find((x: any) => x.id === id); if (m) m.order = i; }); s.modules = [...s.modules]; return { ...s }; });
  },

  /* ---- tasks ---- */
  nextKey(projectId: string) {
    const p = this.state.projects.find((x: any) => x.id === projectId);
    const k = (p ? p.name : "TSK").split(/\s+/).map((w: any) => w[0]).join("").toUpperCase().slice(0, 3) || "T";
    const nums = this.state.tasks.filter((t: any) => t.projectId === projectId && t.key).map((t: any) => parseInt(String(t.key).split("-")[1]) || 0);
    return `${k}-${Math.max(0, ...nums) + 1}`;
  },
  addTask(o: any) {
    const proj = this.state.projects.find((p: any) => p.id === o.projectId);
    const startStatus = o.status || firstStatus(proj);
    const order = Math.min(0, ...this.state.tasks.filter((t: any) => t.projectId === o.projectId && t.status === startStatus).map((t: any) => t.order)) - 1;
    const t = {
      id: uid("t_"), key: this.nextKey(o.projectId), priority: "medium",
      tags: [], subtasks: [], comments: [], timeSpent: 0, description: "", dueDate: null, completedAt: null,
      sprintId: null, moduleId: null, order, createdAt: Date.now(), updatedAt: Date.now(), ...o, status: startStatus,
    };
    if (isDoneStatus(proj, t.status)) t.completedAt = t.completedAt || Date.now();
    this.set((s: any) => { s.tasks = [...s.tasks, t]; this.markActiveToday(); this.logActivity("task", `Created “${t.title}”`, t.projectId); return { ...s }; });
    return t;
  },
  updateTask(id: string, patch: any) {
    this.set((s: any) => {
      const t = s.tasks.find((x: any) => x.id === id); if (!t) return s;
      const proj = s.projects.find((p: any) => p.id === t.projectId);
      const wasDone = isDoneStatus(proj, t.status);
      Object.assign(t, patch, { updatedAt: Date.now() });
      if (patch.status) {
        const nowDone = isDoneStatus(proj, t.status);
        if (nowDone && !wasDone) { t.completedAt = Date.now(); this.markActiveToday(); this.logActivity("task", `Completed “${t.title}”`, t.projectId); }
        if (!nowDone && wasDone) t.completedAt = null;
      }
      s.tasks = [...s.tasks];
      return { ...s };
    });
  },
  moveTask(id: string, status: string, beforeId?: string | null) {
    this.set((s: any) => {
      const t = s.tasks.find((x: any) => x.id === id); if (!t) return s;
      const proj = s.projects.find((p: any) => p.id === t.projectId);
      const wasDone = isDoneStatus(proj, t.status);
      t.status = status; t.updatedAt = Date.now();
      const nowDone = isDoneStatus(proj, status);
      if (nowDone && !wasDone) { t.completedAt = Date.now(); this.markActiveToday(); this.logActivity("task", `Completed “${t.title}”`, t.projectId); }
      if (!nowDone && wasDone) t.completedAt = null;
      const col = s.tasks.filter((x: any) => x.projectId === t.projectId && x.status === status && x.id !== id).sort((a: any, b: any) => a.order - b.order);
      const idx = beforeId ? col.findIndex((x: any) => x.id === beforeId) : col.length;
      col.splice(idx < 0 ? col.length : idx, 0, t);
      col.forEach((x: any, i: number) => x.order = i);
      s.tasks = [...s.tasks];
      return { ...s };
    });
  },
  deleteTask(id: string) { this.set((s: any) => { const t = s.tasks.find((x: any) => x.id === id); s.tasks = s.tasks.filter((x: any) => x.id !== id); if (t) this.logActivity("task", `Deleted “${t.title}”`, t.projectId); return { ...s }; }); },
  addTimeToTask(id: string, sec: number) { this.set((s: any) => { const t = s.tasks.find((x: any) => x.id === id); if (t) { t.timeSpent = (t.timeSpent || 0) + sec; t.updatedAt = Date.now(); this.markActiveToday(); } s.tasks = [...s.tasks]; return { ...s }; }); },
  addTaskComment(taskId: string, text: string) {
    this.set((s: any) => {
      const t = s.tasks.find((x: any) => x.id === taskId);
      if (t) {
        t.comments = t.comments || [];
        t.comments.push({ id: uid("c_"), text: text.trim(), createdAt: Date.now() });
        t.updatedAt = Date.now();
      }
      s.tasks = [...s.tasks];
      return { ...s };
    });
  },
  deleteTaskComment(taskId: string, commentId: string) {
    this.set((s: any) => {
      const t = s.tasks.find((x: any) => x.id === taskId);
      if (t) {
        t.comments = (t.comments || []).filter((c: any) => c.id !== commentId);
        t.updatedAt = Date.now();
      }
      s.tasks = [...s.tasks];
      return { ...s };
    });
  },

  /* ---- docs ---- */
  addDoc(projectId: string, title?: string, content?: string) {
    const dc = { id: uid("d_"), projectId, title: title || "Untitled", content: content || ("# " + (title || "Untitled") + "\n\n"), createdAt: Date.now(), updatedAt: Date.now() };
    this.set((s: any) => { s.docs = [...s.docs, dc]; this.logActivity("doc", `Created “${dc.title}”`, projectId); return { ...s }; });
    return dc;
  },
  updateDoc(id: string, patch: any) { this.set((s: any) => { const dc = s.docs.find((x: any) => x.id === id); if (dc) Object.assign(dc, patch, { updatedAt: Date.now() }); s.docs = [...s.docs]; return { ...s }; }); },
  deleteDoc(id: string) { this.set((s: any) => { s.docs = s.docs.filter((x: any) => x.id !== id); return { ...s }; }); },

  /* ---- sprints ---- */
  addSprint(projectId: string, o: any) {
    const sp = { id: uid("sp_"), projectId, name: o.name || "New Sprint", goal: o.goal || "", startDate: o.startDate, endDate: o.endDate, taskIds: o.taskIds || [] };
    this.set((s: any) => { s.sprints = [...s.sprints, sp]; return { ...s }; });
    return sp;
  },
  updateSprint(id: string, patch: any) { this.set((s: any) => { const sp = s.sprints.find((x: any) => x.id === id); if (sp) Object.assign(sp, patch); s.sprints = [...s.sprints]; return { ...s }; }); },
  deleteSprint(id: string) { this.set((s: any) => { s.sprints = s.sprints.filter((x: any) => x.id !== id); s.tasks.forEach((t: any) => { if (t.sprintId === id) t.sprintId = null; }); s.sprints = [...s.sprints]; s.tasks = [...s.tasks]; return { ...s }; }); },

  /* ---- meta ---- */
  setMeta(patch: any) { this.set((s: any) => { if (!s.meta) s.meta = {}; Object.assign(s.meta, patch); return { ...s }; }); },

  /* ---- data ---- */
  exportAll() { return JSON.stringify(this.state, null, 2); },
  importAll(json: any) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    if (!data.projects || !data.tasks) throw new Error("Not a valid backup file");
    this.set(() => data);
  },
  deleteAll() { const pin = this.state.meta?.pincode || "424242"; const theme = this.state.meta?.theme || "dark"; const fresh = seedState(); fresh.projects = []; fresh.modules = []; fresh.tasks = []; fresh.docs = []; fresh.sprints = []; fresh.activity = []; fresh.meta.pincode = pin; fresh.meta.theme = theme; this.set(() => fresh); },
  resetSeed() { this.set(() => seedState()); },
};

// Auto-load client store if window is defined
if (typeof window !== 'undefined') {
  Store.load();
}

/* -------------------- React glue -------------------- */
export function useStore<T>(selector?: (s: any) => T): T {
  const sel = selector || ((s: any) => s as unknown as T);
  return React.useSyncExternalStore(
    (cb) => Store.sub(cb),
    () => sel(Store.get()),
    () => sel(seedState())
  );
}

export function useStoreFull(): any {
  return React.useSyncExternalStore(
    (cb) => Store.sub(cb),
    () => Store.get(),
    () => seedState()
  );
}

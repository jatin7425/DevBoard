'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Icon } from '@/components/Icon'
import {
  Modal,
  Progress,
  Markdown,
  PriorityBadge,
  useConfirm,
  toast,
  Tag
} from '@/components/ui'
import {
  cx,
  uid,
  fmtClock,
  fmtDuration,
  fmtDateInput,
  fmtDate,
  dueState,
  isDoneStatus,
  getColumns,
  PRIORITY
} from '@/lib/utils'
import { Store, useStore, useStoreFull } from '@/lib/store'

interface FocusTimerProps {
  task: any;
}

export function FocusTimer({ task }: FocusTimerProps) {
  const [mode, setMode] = useState<"stopwatch" | "focus">("stopwatch");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(25 * 60);
  const tickRef = useRef<any>(null);

  const commit = useCallback((sec: number) => {
    if (sec > 0) Store.addTimeToTask(task.id, sec);
  }, [task.id]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      if (mode === "stopwatch") setElapsed(e => e + 1);
      else setRemaining(r => {
        if (r <= 1) {
          setRunning(false);
          commit(25 * 60);
          toast("Focus session complete 🍅 +25m", "success");
          return 25 * 60;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, mode, commit]);

  const stop = () => {
    setRunning(false);
    if (mode === "stopwatch" && elapsed > 0) {
      commit(elapsed);
      setElapsed(0);
    }
  };

  const toggle = () => { if (running) stop(); else setRunning(true); };
  const reset = () => { setRunning(false); setElapsed(0); setRemaining(25 * 60); };

  const display = mode === "stopwatch" ? fmtClock(elapsed) : fmtClock(remaining);
  const total = (task.timeSpent || 0) + (mode === "stopwatch" ? elapsed : 0);

  return (
    <div className={cx("pomo", running && "running")}>
      <div className="seg" style={{ marginBottom: 11 }}>
        <button className={cx(mode === "stopwatch" && "on")} onClick={() => { reset(); setMode("stopwatch"); }}><Icon name="clock" />Stopwatch</button>
        <button className={cx(mode === "focus" && "on")} onClick={() => { reset(); setMode("focus"); }}><Icon name="flame" />Focus 25</button>
      </div>
      <div className="time">{display}</div>
      <div className="ctrls">
        <button className={cx("btn", running ? "btn-default" : "btn-primary", "btn-sm")} onClick={toggle}>
          <Icon name={running ? "pause" : "play"} />{running ? "Pause" : "Start"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={reset}><Icon name="reset" />Reset</button>
      </div>
      <div className="total">Logged total · <b style={{ color: "var(--text)" }}>{fmtDuration(total)}</b></div>
    </div>
  );
}

function Subtasks({ task, project }: { task: any; project: any }) {
  const [val, setVal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const subs = task.subtasks || [];
  const done = subs.filter((s: any) => s.done).length;

  const generateAIChecklist = async () => {
    setAiLoading(true);
    try {
      const pin = localStorage.getItem('devboard_pin') || '';
      const prompt = `You are a senior developer. Propose a technical checklist (breakdown list) of small, actionable tasks to complete this task.

PROJECT: ${project?.name}
PROJECT DESCRIPTION: ${project?.description || "(no description)"}

TASK DETAILS:
- Title: ${task.title}
- Description: ${task.description || "(no description)"}

OUTPUT FORMAT:
Return ONLY a plain text list of checklist items, one per line. Do NOT include checkbox brackets like [ ], numbers, dashes, or markdown formatting. Keep each item short and action-oriented (start with a verb). Max 6 items.`;

      const response = await fetch("/api/ai/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-devboard-pin": pin
        },
        body: JSON.stringify({
          model: "gemini",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) {
        throw new Error("No checklist content returned from AI model");
      }

      const newItems = text
        .split("\n")
        .map((line: string) => line.trim().replace(/^[-*+\d\.\s\[\]x]+/, "").trim())
        .filter((line: string) => line.length > 0)
        .map((title: string) => ({ id: uid("s_"), text: title, done: false }));

      if (newItems.length > 0) {
        Store.updateTask(task.id, { subtasks: [...subs, ...newItems] });
        toast(`Added ${newItems.length} checklist items`, "success");
      } else {
        toast("No checklist items could be generated", "info");
      }
    } catch (e: any) {
      toast("AI checklist failed: " + (e.message || e), "error");
    }
    setAiLoading(false);
  };

  const add = () => {
    if (!val.trim()) return;
    Store.updateTask(task.id, { subtasks: [...subs, { id: uid("s_"), text: val.trim(), done: false }] });
    setVal("");
  };
  const toggle = (id: string) => Store.updateTask(task.id, { subtasks: subs.map((s: any) => s.id === id ? { ...s, done: !s.done } : s) });
  const edit = (id: string, text: string) => Store.updateTask(task.id, { subtasks: subs.map((s: any) => s.id === id ? { ...s, text } : s) });
  const del = (id: string) => Store.updateTask(task.id, { subtasks: subs.filter((s: any) => s.id !== id) });
  return (
    <div>
      <div className="flex aic jcb mb6">
        <div className="flex aic gap8">
          <div className="sec-title" style={{ margin: 0 }}><Icon name="check" />Checklist</div>
          <button 
            className="btn btn-ghost btn-xs text-xs" 
            style={{ fontSize: 10.5, padding: "2px 6px", height: 20, display: "inline-flex", alignItems: "center", gap: 3 }} 
            onClick={generateAIChecklist} 
            disabled={aiLoading}
          >
            {aiLoading ? <><Icon name="refresh" className="spin" size={10} />Generating…</> : <><Icon name="zap" size={10} />AI Checklist</>}
          </button>
        </div>
        {subs.length > 0 && <span className="dim" style={{ fontSize: 12 }}>{done}/{subs.length}</span>}
      </div>
      {subs.length > 0 && <div className="mb12"><Progress value={subs.length ? done / subs.length * 100 : 0} done={done === subs.length} thin /></div>}
      {subs.map((s: any) => (
        <div key={s.id} className={cx("subtask", s.done && "done")}>
          <div className={cx("chk", s.done && "on")} onClick={() => toggle(s.id)}><Icon name="check" /></div>
          <input className="stx" value={s.text} onChange={(e) => edit(s.id, e.target.value)} />
          <button className="del btn-icon sm" onClick={() => del(s.id)}><Icon name="x" /></button>
        </div>
      ))}
      <div className="flex aic gap8 mt8">
        <input className="input input-sm" placeholder="Add a checklist item…" value={val}
          onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
        <button className="btn btn-default btn-sm" onClick={add} disabled={!val.trim()}><Icon name="plus" /></button>
      </div>
    </div>
  );
}

function Comments({ task }: { task: any }) {
  const [val, setVal] = useState("");
  const comments = task.comments || [];
  const add = () => {
    if (!val.trim()) return;
    Store.addTaskComment(task.id, val.trim());
    setVal("");
  };
  const del = (cid: string) => {
    Store.deleteTaskComment(task.id, cid);
  };
  return (
    <div>
      <div className="flex aic jcb mb6">
        <div className="sec-title" style={{ margin: 0 }}><Icon name="message" />Comments</div>
        {comments.length > 0 && <span className="dim" style={{ fontSize: 12 }}>{comments.length}</span>}
      </div>
      {comments.length > 0 && (
        <div className="flex flex-col gap8 mb12" style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {comments.map((c: any) => (
            <div key={c.id} className="card" style={{ padding: "8px 12px", fontSize: 13, position: "relative" }}>
              <div className="flex aic jcb mb4">
                <span className="dim" style={{ fontSize: 11 }}>{new Date(c.createdAt).toLocaleString()}</span>
                <button className="btn-icon sm hover-danger" onClick={() => del(c.id)} style={{ padding: 2, background: "transparent", border: "none" }}>
                  <Icon name="x" style={{ width: 12, height: 12, opacity: 0.6 }} />
                </button>
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>{c.text}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap8">
        <input 
          className="input input-sm" 
          placeholder="Add a comment…" 
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }} 
        />
        <button 
          className="btn btn-default btn-sm" 
          onClick={add} 
          disabled={!val.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function TagEditor({ task }: { task: any }) {
  const [val, setVal] = useState("");
  const tags = task.tags || [];
  const add = () => { const t = val.trim().toLowerCase().replace(/^#/, ""); if (t && !tags.includes(t)) Store.updateTask(task.id, { tags: [...tags, t] }); setVal(""); };
  return (
    <div className="flex aic gap8" style={{ flexWrap: "wrap" }}>
      {tags.map((t: any) => (
        <span key={t} className="tag">{t}<button onClick={() => Store.updateTask(task.id, { tags: tags.filter((x: any) => x !== t) })} style={{ display: "inline-flex" }}><Icon name="x" style={{ width: 11, height: 11 }} /></button></span>
      ))}
      <input className="input input-sm" style={{ width: 110 }} placeholder="+ tag" value={val}
        onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add} />
    </div>
  );
}

function SideSelect({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return <div className="row"><div className="k"><Icon name={icon} style={{ width: 12, height: 12, marginRight: 5, verticalAlign: "-1px" }} />{label}</div>{children}</div>;
}

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

export function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const task = useStore(s => s.tasks.find((t: any) => t.id === taskId));
  const state = useStoreFull();
  const project = task ? state.projects.find((p: any) => p.id === task.projectId) : null;
  const mods = task ? state.modules.filter((m: any) => m.projectId === task.projectId).sort((a: any, b: any) => a.order - b.order) : [];

  const [descMode, setDescMode] = useState("write");
  const [aiLoading, setAiLoading] = useState(false);
  const [confirm, confirmNode] = useConfirm();
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const generateAIDescription = async (mode: 'describe' | 'reframe') => {
    if (!task) return;
    if (mode === 'reframe' && !task.description.trim()) {
      toast("No description to reframe. Write something first!", "info");
      return;
    }
    setAiLoading(true);
    try {
      const pin = localStorage.getItem('devboard_pin') || '';
      let prompt = '';
      if (mode === 'describe') {
        prompt = `You are a senior technical writer and developer.
Generate a concise, professional, and action-oriented markdown description for the following task.

PROJECT: ${project?.name}
PROJECT DESCRIPTION: ${project?.description || "(no description)"}

TASK DETAILS:
- Key: ${task.key}
- Title: ${task.title}
- Priority: ${task.priority}
- Status: ${task.status}
- Tags: ${(task.tags || []).join(", ") || "(none)"}
- Checklist items: ${(task.subtasks || []).map((s: any) => `- [${s.done ? "x" : " "}] ${s.text}`).join("\n") || "(none)"}

OUTPUT FORMAT:
Return ONLY the markdown description itself. No explanations, no introductory or concluding sentences. Focus on:
1. Objective of the task.
2. Steps/Technical approach to solve it.
3. Acceptance criteria or definition of done.`;
      } else {
        prompt = `You are a senior technical writer.
Reframe, polish, and improve the grammar, structure, and clarity of the following task description while retaining its technical details. Use clean markdown formatting.

PROJECT: ${project?.name}
TASK TITLE: ${task.title}

CURRENT DESCRIPTION:
${task.description}

OUTPUT FORMAT:
Return ONLY the polished markdown description itself. Do NOT include any explanations, introductions, or summary of changes.`;
      }

      const response = await fetch("/api/ai/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-devboard-pin": pin
        },
        body: JSON.stringify({
          model: "gemini",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) {
        throw new Error("No description content returned from AI model");
      }
      Store.updateTask(task.id, { description: text.trim() });
      toast(mode === 'describe' ? "AI description generated" : "Description polished", "success");
    } catch (e: any) {
      toast("AI generation failed: " + (e.message || e), "error");
    }
    setAiLoading(false);
  };

  if (!task) return null;

  const del = async () => {
    if (await confirm({ title: "Delete task?", message: `“${task.title}” will be permanently removed.`, danger: true, confirmText: "Delete" })) {
      Store.deleteTask(task.id); toast("Task deleted", "success"); onClose();
    }
  };

  return (
    <Modal open onClose={onClose} width={880}>
      <div className="task-detail">
        <div className="td-main">
          <div className="td-id">
            <span style={{ width: 9, height: 9, borderRadius: 3, background: project?.color }} />
            <span>{task.key}</span><span className="faint">·</span><span>{project?.name}</span>
          </div>
          <textarea ref={titleRef} className="td-title" rows={1} value={task.title}
            onChange={(e) => Store.updateTask(task.id, { title: e.target.value })}
            onInput={(e: any) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} />

          <div className="flex aic gap8 mt16 mb12">
            <div className="seg">
              <button className={cx(descMode === "write" && "on")} onClick={() => setDescMode("write")}><Icon name="edit" />Write</button>
              <button className={cx(descMode === "preview" && "on")} onClick={() => setDescMode("preview")}><Icon name="eye" />Preview</button>
            </div>
            <span className="faint" style={{ fontSize: 11.5 }}>Markdown supported</span>
            <div className="flex aic gap6" style={{ marginLeft: "auto" }}>
              <button className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => generateAIDescription('describe')} disabled={aiLoading}>
                <Icon name="zap" />AI Describe
              </button>
              {task.description && (
                <button className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => generateAIDescription('reframe')} disabled={aiLoading}>
                  <Icon name="refresh" />AI Improve
                </button>
              )}
            </div>
          </div>
          {descMode === "write" ? (
            <textarea className="textarea" style={{ minHeight: 150, fontFamily: "var(--mono)", fontSize: 13 }}
              placeholder="Add a description… **bold**, `code`, - lists, > quotes"
              value={task.description} onChange={(e) => Store.updateTask(task.id, { description: e.target.value })} />
          ) : (
            task.description ? <Markdown source={task.description} /> : <p className="faint" style={{ fontSize: 13 }}>No description yet.</p>
          )}

          <div className="mt24"><Subtasks task={task} project={project} /></div>
          <div className="mt24"><Comments task={task} /></div>
        </div>

        <div className="td-side">
          <div className="flex aic jcb mb16">
            <span className="faint" style={{ fontSize: 11.5 }}>Updated {task.updatedAt ? (new Date(task.updatedAt).toLocaleDateString()) : ""}</span>
            <button className="btn-icon sm" onClick={onClose}><Icon name="x" /></button>
          </div>

          <SideSelect label="Status" icon="board">
            <select className="select input-sm" value={task.status} onChange={(e) => Store.updateTask(task.id, { status: e.target.value })}>
              {getColumns(project).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </SideSelect>
          <SideSelect label="Priority" icon="flag">
            <select className="select input-sm" value={task.priority} onChange={(e) => Store.updateTask(task.id, { priority: e.target.value })}>
              {Object.keys(PRIORITY).map(p => <option key={p} value={p}>{PRIORITY[p].label}</option>)}
            </select>
          </SideSelect>
          <SideSelect label="Module" icon="cube">
            <select className="select input-sm" value={task.moduleId || ""} onChange={(e) => Store.updateTask(task.id, { moduleId: e.target.value || null })}>
              <option value="">— None —</option>
              {mods.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </SideSelect>
          <SideSelect label="Due date" icon="calendar">
            <input type="date" className="input input-sm" value={fmtDateInput(task.dueDate)} onChange={(e) => Store.updateTask(task.id, { dueDate: e.target.value ? new Date(e.target.value + "T12:00").getTime() : null })} />
            {task.dueDate && dueState(task.dueDate, isDoneStatus(project, task.status)) === "over" && <div style={{ color: "var(--p-crit)", fontSize: 11.5, marginTop: 5 }}>Overdue</div>}
          </SideSelect>
          <SideSelect label="Tags" icon="tag"><TagEditor task={task} /></SideSelect>

          <div className="row"><div className="k"><Icon name="clock" style={{ width: 12, height: 12, marginRight: 5, verticalAlign: "-1px" }} />Time tracking</div><FocusTimer task={task} /></div>

          <div className="menu-sep" style={{ margin: "14px 0" }} />
          <button className="btn btn-danger btn-block btn-sm" onClick={del}><Icon name="trash" />Delete task</button>
        </div>
      </div>
      {confirmNode}
    </Modal>
  );
}

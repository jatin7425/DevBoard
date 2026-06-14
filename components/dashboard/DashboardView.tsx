'use client'
import React, { useMemo } from 'react'
import { Icon } from '@/components/Icon'
import {
  Empty,
  Progress,
  StatusDot,
  toast
} from '@/components/ui'
import {
  cx,
  DAY,
  startOfDay,
  dueState,
  fmtDate,
  relTime,
  isTaskDone,
  isDoneStatus,
  firstStatus,
  colOf,
  getColumns
} from '@/lib/utils'
import { useStoreFull } from '@/lib/store'

interface DashboardViewProps {
  onOpenTask: (id: string) => void;
  onOpenProject: (id: string) => void;
  onNav: (v: string) => void;
}

export function DashboardView({ onOpenTask, onOpenProject, onNav }: DashboardViewProps) {
  const state = useStoreFull();
  const projects = state.projects.filter((p: any) => !p.archived).sort((a: any, b: any) => a.order - b.order);
  const tasks = state.tasks;
  const activeProjIds = new Set(projects.map((p: any) => p.id));
  const liveTasks = tasks.filter((t: any) => activeProjIds.has(t.projectId));

  const now = new Date();
  const proj = (id: string) => state.projects.find((p: any) => p.id === id);
  const weekEnd = startOfDay(now).getTime() + 7 * DAY;
  const dueThisWeek = liveTasks.filter((t: any) => !isTaskDone(state, t) && t.dueDate && t.dueDate <= weekEnd).sort((a: any, b: any) => a.dueDate - b.dueDate);
  const overdue = liveTasks.filter((t: any) => !isTaskDone(state, t) && t.dueDate && dueState(t.dueDate, false) === "over").length;
  const doneThisWeek = liveTasks.filter((t: any) => t.completedAt && t.completedAt >= startOfDay(now).getTime() - 7 * DAY).length;
  const inProgress = liveTasks.filter((t: any) => { const p = proj(t.projectId); return !isDoneStatus(p, t.status) && t.status !== firstStatus(p); }).length;
  const recent = [...liveTasks].sort((a: any, b: any) => b.updatedAt - a.updatedAt).slice(0, 6);

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1>{greeting} 👋</h1>
          <p>{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · {state.meta?.streak > 0 && <span style={{ color: "var(--accent)" }}><Icon name="flame" style={{ width: 13, height: 13, verticalAlign: "-2px" }} /> {state.meta.streak}-day streak</span>}</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNav("calendar")}><Icon name="calendar" />This week</button>
      </div>

      <div className="stats-grid mb20">
        <div className="stat"><div className="lbl"><Icon name="folder" />Active projects</div><div className="val">{projects.length}</div><div className="sub">{state.projects.length - projects.length} archived</div></div>
        <div className="stat"><div className="lbl"><Icon name="board" />Open tasks</div><div className="val">{liveTasks.filter((t: any) => !isTaskDone(state, t)).length}</div><div className="sub">{inProgress} in progress</div></div>
        <div className="stat"><div className="lbl"><Icon name="calendar" />Due this week</div><div className="val">{dueThisWeek.length}</div><div className="sub" style={{ color: overdue ? "var(--p-crit)" : undefined }}>{overdue ? `${overdue} overdue` : "on track"}</div></div>
        <div className="stat"><div className="lbl"><Icon name="check" />Done this week</div><div className="val">{doneThisWeek}</div><div className="sub">keep it up</div></div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
        <div>
          <div className="sec-title"><Icon name="folder" />Projects</div>
          <div className="pcards">
            {projects.map((p: any) => {
              const pt = tasks.filter((t: any) => t.projectId === p.id);
              const doneN = pt.filter((t: any) => isDoneStatus(p, t.status)).length;
              const prog = pt.length ? Math.round(doneN / pt.length * 100) : 0;
              return (
                <div key={p.id} className="pcard" onClick={() => onOpenProject(p.id)}>
                  <div className="ph"><span className="pdot" style={{ background: p.color }} /><span className="pn">{p.name}</span><Icon name="arrowRight" style={{ width: 15, color: "var(--text-3)" }} /></div>
                  <div className="pdesc">{p.description}</div>
                  <div className="pstat"><span>{prog}% complete</span><span>{doneN}/{pt.length}</span></div>
                  <Progress value={prog} done={prog === 100} />
                  <div className="pmeta">
                    <span><b>{pt.filter((t: any) => !isDoneStatus(p, t.status)).length}</b> open</span>
                    <span><b>{getColumns(p).length}</b> columns</span>
                    <span><b>{state.modules.filter((m: any) => m.projectId === p.id).length}</b> modules</span>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && <Empty icon="folder" title="No projects yet" sub="Create your first project to get started." />}
          </div>
        </div>

        <div>
          <div className="sec-title"><Icon name="calendar" />Due this week</div>
          <div className="card" style={{ padding: 7, marginBottom: 22 }}>
            {dueThisWeek.length === 0 && <div className="faint" style={{ padding: 16, fontSize: 13, textAlign: "center" }}>Nothing due — clear skies ☀️</div>}
            {dueThisWeek.slice(0, 6).map((t: any) => (
              <div key={t.id} className="lrow" onClick={() => onOpenTask(t.id)}>
                <span className="sdot" style={{ background: proj(t.projectId)?.color }} />
                <span className="lt">{t.title}</span>
                <span className="lm" style={{ color: dueState(t.dueDate, false) === "over" ? "var(--p-crit)" : undefined }}>{fmtDate(t.dueDate)}</span>
              </div>
            ))}
          </div>

          <div className="sec-title"><Icon name="activity" />Recently updated</div>
          <div className="card" style={{ padding: 7 }}>
            {recent.map((t: any) => (
              <div key={t.id} className="lrow" onClick={() => onOpenTask(t.id)}>
                <StatusDot color={colOf(state, t).color} />
                <span className="lt">{t.title}</span>
                <span className="lm">{relTime(t.updatedAt)}</span>
              </div>
            ))}
            {recent.length === 0 && <div className="faint" style={{ padding: 16, fontSize: 13, textAlign: "center" }}>No activity yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

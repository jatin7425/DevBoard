'use client'
import React, { useMemo } from 'react'
import { Icon } from '@/components/Icon'
import { useStoreFull, Store } from '@/lib/store'
import {
  Empty,
  StatusDot,
  PriorityBadge
} from '@/components/ui'
import {
  cx,
  DAY,
  startOfDay,
  daysBetween,
  isTaskDone,
  MON,
  getColumns,
  colOf
} from '@/lib/utils'

interface BurndownProps {
  sprint: any;
  tasks: any[];
}

export function Burndown({ sprint, tasks }: BurndownProps) {
  const W = 640, H = 240, pad = 36;
  const total = sprint.taskIds.length || tasks.length;
  const start = startOfDay(sprint.startDate).getTime(), end = startOfDay(sprint.endDate).getTime();
  const days = Math.max(1, Math.round((end - start) / DAY));
  const today = startOfDay(Date.now()).getTime();
  const px = (i: number) => pad + (i / days) * (W - pad * 2);
  const py = (v: number) => pad + (1 - v / (total || 1)) * (H - pad * 2);

  const ideal = [];
  for (let i = 0; i <= days; i++) ideal.push([px(i), py(total - (total / days) * i)]);

  const actual = [];
  for (let i = 0; i <= days; i++) {
    const day = start + i * DAY;
    if (day > today + DAY) break;
    const doneBy = tasks.filter(t => t.completedAt && startOfDay(t.completedAt).getTime() <= day).length;
    actual.push([px(i), py(total - doneBy)]);
  }
  const line = (pts: number[][]) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = actual.length ? `${line(actual)} L${actual[actual.length - 1][0].toFixed(1)} ${py(0).toFixed(1)} L${px(0).toFixed(1)} ${py(0).toFixed(1)} Z` : "";

  return (
    <div className="burndown">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {[0, .25, .5, .75, 1].map((f, i) => (
          <g key={i}><line className="bd-axis" x1={pad} y1={py(total * f)} x2={W - pad} y2={py(total * f)} style={{ opacity: .4 }} />
            <text x={pad - 8} y={py(total * f) + 4} textAnchor="end" fontSize="10" fill="var(--text-3)">{Math.round(total * f)}</text></g>
        ))}
        {area && <path className="bd-area" d={area} />}
        <path className="bd-ideal" d={line(ideal)} />
        {actual.length > 0 && <path className="bd-actual" d={line(actual)} />}
        {actual.length > 0 && <circle className="bd-dot" cx={actual[actual.length - 1][0]} cy={actual[actual.length - 1][1]} r="4" />}
        <text x={pad} y={H - 10} fontSize="10" fill="var(--text-3)">{MON[new Date(start).getMonth()]} {new Date(start).getDate()}</text>
        <text x={W - pad} y={H - 10} textAnchor="end" fontSize="10" fill="var(--text-3)">{MON[new Date(end).getMonth()]} {new Date(end).getDate()}</text>
      </svg>
      <div className="flex aic gap12 mt8" style={{ justifyContent: "center", fontSize: 12, color: "var(--text-3)" }}>
        <span className="flex aic gap8"><span style={{ width: 16, height: 2.5, background: "var(--accent)", display: "inline-block", borderRadius: 2 }} />Actual</span>
        <span className="flex aic gap8"><span style={{ width: 16, height: 0, borderTop: "2px dashed var(--text-4)", display: "inline-block" }} />Ideal</span>
      </div>
    </div>
  );
}

interface SprintViewProps {
  projectId: string;
  onOpenTask: (id: string) => void;
}

export function SprintView({ projectId, onOpenTask }: SprintViewProps) {
  const state = useStoreFull();
  const sprints = state.sprints.filter((s: any) => projectId === "all" || s.projectId === projectId).sort((a: any, b: any) => b.startDate - a.startDate);
  const proj = (id: string) => state.projects.find((p: any) => p.id === id);

  return (
    <div className="wrap">
      <div className="page-head"><div><h1>Sprints</h1><p>Time-boxed work with burndown tracking</p></div></div>
      {sprints.length === 0 && <Empty icon="sprint" title="No sprints yet" sub="Group tasks into a time-boxed sprint to track a burndown." />}
      {sprints.map((sp: any) => {
        const tasks = state.tasks.filter((t: any) => sp.taskIds.includes(t.id));
        const done = tasks.filter((t: any) => isTaskDone(state, t)).length;
        const prog = tasks.length ? Math.round(done / tasks.length * 100) : 0;
        const daysLeft = daysBetween(new Date(), new Date(sp.endDate));
        return (
          <div key={sp.id} className="panel mb20" style={{ padding: 20 }}>
            <div className="flex aic jcb mb16" style={{ flexWrap: "wrap", gap: 12 }}>
              <div>
                <div className="flex aic gap8"><span style={{ width: 9, height: 9, borderRadius: 3, background: proj(sp.projectId)?.color }} /><h2 style={{ fontSize: 17, fontWeight: 600 }}>{sp.name}</h2>
                  <span className="badge" style={{ color: daysLeft < 0 ? "var(--p-crit)" : daysLeft <= 2 ? "var(--p-high)" : "var(--text-2)" }}>{daysLeft < 0 ? "ended" : daysLeft === 0 ? "ends today" : `${daysLeft}d left`}</span></div>
                <p className="dim" style={{ fontSize: 13, marginTop: 4 }}>{sp.goal}</p>
              </div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 600 }}>{prog}%</div><div className="faint" style={{ fontSize: 12 }}>{done}/{tasks.length} done</div></div>
            </div>
            <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 1fr", alignItems: "start" }}>
              <Burndown sprint={sp} tasks={tasks} />
              <div>
                <div className="sec-title">Sprint backlog</div>
                <div className="card" style={{ padding: 6, maxHeight: 280, overflowY: "auto" }}>
                  {tasks.slice().sort((a: any, b: any) => {
                    const pa = state.projects.find((p: any) => p.id === a.projectId);
                    const cols = getColumns(pa).map((c: any) => c.id);
                    return cols.indexOf(a.status) - cols.indexOf(b.status);
                  }).map((t: any) => {
                    const tdone = isTaskDone(state, t);
                    return (
                      <div key={t.id} className="lrow" onClick={() => onOpenTask(t.id)}>
                        <StatusDot color={colOf(state, t).color} />
                        <span className="lt" style={{ textDecoration: tdone ? "line-through" : "none", color: tdone ? "var(--text-3)" : undefined }}>{t.title}</span>
                        <PriorityBadge priority={t.priority} withLabel={false} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

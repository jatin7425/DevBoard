'use client'
import React, { useState } from 'react'
import { Icon } from '@/components/Icon'
import { useStoreFull } from '@/lib/store'
import {
  cx,
  startOfDay,
  isSameDay,
  dueState,
  isTaskDone,
  MONL,
  WD,
  MON
} from '@/lib/utils'

interface CalendarViewProps {
  projectId: string;
  onOpenTask: (id: string) => void;
}

export function CalendarView({ projectId, onOpenTask }: CalendarViewProps) {
  const state = useStoreFull();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const tasks = state.tasks.filter((t: any) => (projectId === "all" || t.projectId === projectId) && t.dueDate);
  const proj = (id: string) => state.projects.find((p: any) => p.id === id);

  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1), startWd = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const today = startOfDay(new Date()).getTime();

  return (
    <div className="wrap">
      <div className="page-head">
        <div><h1>Calendar</h1><p>Due dates across {projectId === "all" ? "all projects" : proj(projectId)?.name}</p></div>
        <div className="flex aic gap8">
          <button className="btn-icon" onClick={() => setCursor(new Date(y, m - 1, 1))}><Icon name="chevron" style={{ transform: "rotate(180deg)" }} /></button>
          <span style={{ minWidth: 150, textAlign: "center", fontWeight: 600 }}>{MONL[m]} {y}</span>
          <button className="btn-icon" onClick={() => setCursor(new Date(y, m + 1, 1))}><Icon name="chevron" /></button>
          <button className="btn btn-default btn-sm" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Today</button>
        </div>
      </div>
      <div className="cal">
        <div className="cal-head">{WD.map(d => <div key={d}>{d}</div>)}</div>
        <div className="cal-grid">
          {cells.map((c, i) => {
            const evs = c ? tasks.filter((t: any) => isSameDay(t.dueDate, c)) : [];
            const isToday = c && startOfDay(c).getTime() === today;
            return (
              <div key={i} className={cx("cal-cell", !c && "dim", isToday && "today")}>
                {c && <div className="dn">{c.getDate()}</div>}
                {evs.slice(0, 4).map((t: any) => (
                  <div key={t.id} className={cx("cal-ev", dueState(t.dueDate, isTaskDone(state, t)) === "over" && "over")}
                    style={{ borderLeftColor: proj(t.projectId)?.color || "var(--accent)" }} onClick={() => onOpenTask(t.id)} title={t.title}>
                    {isTaskDone(state, t) ? "✓ " : ""}{t.title}
                  </div>
                ))}
                {evs.length > 4 && <div className="faint" style={{ fontSize: 10.5, paddingLeft: 6 }}>+{evs.length - 4} more</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

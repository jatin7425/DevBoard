'use client'
import React from 'react'
import { Icon } from '@/components/Icon'
import { useStoreFull, Store } from '@/lib/store'
import {
  cx,
  DAY,
  startOfDay,
  fmtDateInput,
  fmtDate
} from '@/lib/utils'
import { toast } from '@/components/ui'

interface ReviewViewProps {
  onOpenTask: (id: string) => void;
}

export function ReviewView({ onOpenTask }: ReviewViewProps) {
  const state = useStoreFull();
  const now = new Date();
  const weekAgo = startOfDay(now).getTime() - 6 * DAY;
  const completed = state.tasks.filter((t: any) => t.completedAt && t.completedAt >= weekAgo).sort((a: any, b: any) => b.completedAt - a.completedAt);
  const created = state.tasks.filter((t: any) => t.createdAt >= weekAgo).length;
  const totalTime = state.tasks.reduce((a: number, t: any) => a + (t.timeSpent || 0), 0);
  const proj = (id: string) => state.projects.find((p: any) => p.id === id);

  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(startOfDay(now).getTime() - i * DAY);
    const key = fmtDateInput(day.getTime());
    const count = (state.meta?.streakDays || {})[key] || 0;
    last14.push({ day, count, key });
  }
  const lvl = (c: number) => c === 0 ? "" : c < 2 ? "l1" : c < 4 ? "l2" : c < 7 ? "l3" : "l4";

  const logReview = () => {
    Store.setMeta({ lastReview: Date.now(), streak: (state.meta?.streak || 0) + 1 });
    toast("Weekly review logged — streak +1 🔥", "success");
  };

  return (
    <div className="wrap">
      <div className="page-head">
        <div><h1>Weekly Review</h1><p>Reflect on the week, then close it out</p></div>
        <button className="btn btn-primary" onClick={logReview}><Icon name="check" />Log this review</button>
      </div>

      <div className="stats-grid mb20">
        <div className="stat"><div className="lbl"><Icon name="check" />Completed</div><div className="val">{completed.length}</div><div className="sub">this week</div></div>
        <div className="stat"><div className="lbl"><Icon name="plus" />Created</div><div className="val">{created}</div><div className="sub">new tasks</div></div>
        <div className="stat"><div className="lbl"><Icon name="clock" />Time tracked</div><div className="val">{Math.round(totalTime / 3600)}h</div><div className="sub">all-time logged</div></div>
        <div className="stat"><div className="lbl"><Icon name="flame" />Streak</div><div className="val">{state.meta?.streak || 0}</div><div className="sub">days active</div></div>
      </div>

      <div className="panel mb20" style={{ padding: 18 }}>
        <div className="sec-title"><Icon name="flame" />Activity — last 14 days</div>
        <div className="streak-grid">
          {last14.map((d, i) => (
            <div key={i} className={cx("streak-day", lvl(d.count))} title={`${d.key}: ${d.count} actions`}>
              <span style={{ opacity: .7 }}>{d.day.getDate()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sec-title"><Icon name="check" />Shipped this week</div>
      <div className="card" style={{ padding: 7 }}>
        {completed.length === 0 && <div className="faint" style={{ padding: 16, fontSize: 13, textAlign: "center" }}>Nothing completed yet this week — go ship something ✨</div>}
        {completed.map((t: any) => (
          <div key={t.id} className="lrow" onClick={() => onOpenTask(t.id)}>
            <span className="sdot" style={{ background: proj(t.projectId)?.color }} />
            <span className="lt">{t.title}</span>
            <span className="lm">{fmtDate(t.completedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

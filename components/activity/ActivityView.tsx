'use client'
import React from 'react'
import { Icon } from '@/components/Icon'
import { useStoreFull } from '@/lib/store'
import { Empty } from '@/components/ui'
import { relTime } from '@/lib/utils'

interface ActivityViewProps {
  projectId: string;
}

export function ActivityView({ projectId }: ActivityViewProps) {
  const state = useStoreFull();
  const acts = state.activity.filter((a: any) => projectId === "all" || a.projectId === projectId);
  const proj = (id: string) => state.projects.find((p: any) => p.id === id);
  const icon = (t: string) => {
    const m: Record<string, string> = { task: "board", doc: "doc", project: "folder", module: "cube" };
    return m[t] || "dot";
  };
  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <div className="page-head"><div><h1>Activity</h1><p>Everything that's happened, newest first</p></div></div>
      {acts.length === 0 && <Empty icon="activity" title="No activity yet" sub="Your actions will show up here." />}
      <div className="panel" style={{ padding: "8px 18px" }}>
        {acts.map((a: any) => (
          <div key={a.id} className="act-item act-line">
            <span className="adot" style={{ background: proj(a.projectId)?.color || "var(--accent)" }} />
            <div className="atx"><Icon name={icon(a.type)} style={{ width: 13, height: 13, verticalAlign: "-2px", color: "var(--text-3)", marginRight: 6 }} />{a.text}{proj(a.projectId) && <span className="faint"> · {proj(a.projectId).name}</span>}</div>
            <span className="atime">{relTime(a.ts)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

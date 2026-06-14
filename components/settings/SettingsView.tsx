'use client'
import React, { useState, useRef } from 'react'
import { Icon } from '@/components/Icon'
import { useStoreFull, Store } from '@/lib/store'
import { useConfirm, toast } from '@/components/ui'
import { cx, fmtDateInput, download } from '@/lib/utils'

export function SettingsView() {
  const state = useStoreFull();
  const meta = state.meta || {};
  const [confirm, confirmNode] = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  const counts = {
    projects: state.projects.length,
    tasks: state.tasks.length,
    docs: state.docs.length
  };

  const exportData = () => {
    download(`personal-jira-backup-${fmtDateInput(Date.now())}.json`, Store.exportAll(), "application/json");
    toast("Backup exported", "success");
  };

  const importData = (file: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      if (await confirm({ title: "Import backup?", message: "This replaces ALL current data with the contents of the file. This can't be undone.", danger: true, confirmText: "Import & replace" })) {
        try {
          Store.importAll(String(r.result));
          toast("Backup imported", "success");
        } catch (e: any) {
          toast("Import failed: " + e.message, "error");
        }
      }
    };
    r.readAsText(file);
  };

  const deleteAll = async () => {
    if (await confirm({ title: "Delete all data?", message: "Every project, task, and doc will be permanently erased.", danger: true, confirmText: "Delete everything" })) {
      Store.deleteAll();
      toast("All data deleted", "success");
    }
  };

  const resetDemo = async () => {
    if (await confirm({ title: "Restore demo data?", message: "This replaces current data with the original sample workspace.", danger: true, confirmText: "Restore demo" })) {
      Store.resetSeed();
      toast("Demo data restored", "success");
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div className="page-head"><div><h1>Settings</h1><p>Security, data, and preferences</p></div></div>

      <div className="panel mb20" style={{ padding: 20 }}>
        <div className="sec-title"><Icon name="settings" />Preferences</div>
        <div className="flex aic jcb" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div><div style={{ fontWeight: 500 }}>Theme</div><div className="faint" style={{ fontSize: 12.5 }}>Light or dark appearance</div></div>
          <div className="seg">
            <button className={cx(meta.theme === "light" && "on")} onClick={() => Store.setMeta({ theme: "light" })}><Icon name="sun" />Light</button>
            <button className={cx(meta.theme === "dark" && "on")} onClick={() => Store.setMeta({ theme: "dark" })}><Icon name="moon" />Dark</button>
          </div>
        </div>
        <div className="flex aic jcb" style={{ padding: "10px 0" }}>
          <div><div style={{ fontWeight: 500 }}>Auto-lock</div><div className="faint" style={{ fontSize: 12.5 }}>Lock after inactivity</div></div>
          <select className="select" style={{ width: 150 }} value={meta.autoLockMin} onChange={e => Store.setMeta({ autoLockMin: Number(e.target.value) })}>
            {[1, 2, 5, 10, 30].map(n => <option key={n} value={n}>{n} minute{n > 1 ? "s" : ""}</option>)}
            <option value={9999}>Never</option>
          </select>
        </div>
      </div>

      <div className="panel mb20" style={{ padding: 20 }}>
        <div className="sec-title"><Icon name="lock" />Security</div>
        <p className="dim" style={{ fontSize: 13 }}>Pincode authentication is set securely via <code className="mono">DEVBOARD_PIN</code> in the environment variables (<code className="mono">.env.local</code>).</p>
      </div>

      <div className="panel mb20" style={{ padding: 20 }}>
        <div className="sec-title"><Icon name="database" />Data</div>
        <div className="flex aic gap12 mb16" style={{ fontSize: 13, color: "var(--text-2)" }}>
          <span><b style={{ color: "var(--text)" }}>{counts.projects}</b> projects</span><span className="faint">·</span>
          <span><b style={{ color: "var(--text)" }}>{counts.tasks}</b> tasks</span><span className="faint">·</span>
          <span><b style={{ color: "var(--text)" }}>{counts.docs}</b> docs</span>
        </div>
        <div className="flex aic gap8" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-default btn-sm" onClick={exportData}><Icon name="download" />Export all (JSON)</button>
          <button className="btn btn-default btn-sm" onClick={() => fileRef.current?.click()}><Icon name="upload" />Import backup</button>
          <button className="btn btn-default btn-sm" onClick={resetDemo}><Icon name="refresh" />Restore demo data</button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={e => importData(e.target.files ? e.target.files[0] : null)} />
        </div>
      </div>

      <div className="panel" style={{ padding: 20, borderColor: "rgba(239,68,68,.3)" }}>
        <div className="sec-title" style={{ color: "var(--p-crit)" }}><Icon name="alert" />Danger zone</div>
        <div className="flex aic jcb">
          <div><div style={{ fontWeight: 500 }}>Delete all data</div><div className="faint" style={{ fontSize: 12.5 }}>Erase every project, task, and doc. Cannot be undone.</div></div>
          <button className="btn btn-danger btn-sm" onClick={deleteAll}><Icon name="trash" />Delete all</button>
        </div>
      </div>
      {confirmNode}
    </div>
  );
}

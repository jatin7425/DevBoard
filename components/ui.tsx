'use client'
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { Icon } from '@/components/Icon'
import {
  uid,
  cx,
  PRIORITY,
  STATUS,
  dueState,
  fmtDate,
  mdToHtml,
  isDoneStatus
} from '@/lib/utils'

/* -------------------- Toasts -------------------- */
export interface ToastItem {
  id: string;
  msg: string;
  type: "info" | "success" | "error";
}

export const ToastBus = {
  items: [] as ToastItem[],
  listeners: new Set<() => void>(),
  push(msg: string, type: ToastItem["type"] = "info") {
    const id = uid("toast_");
    this.items = [...this.items, { id, msg, type }];
    this.emit();
    setTimeout(() => this.dismiss(id), 3200);
    return id;
  },
  dismiss(id: string) {
    this.items = this.items.filter(t => t.id !== id);
    this.emit();
  },
  emit() {
    this.listeners.forEach(l => l());
  },
};

export function toast(msg: string, type?: ToastItem["type"]) {
  return ToastBus.push(msg, type);
}

export function ToastHost() {
  const items = React.useSyncExternalStore(
    (cb) => {
      ToastBus.listeners.add(cb);
      return () => ToastBus.listeners.delete(cb);
    },
    () => ToastBus.items,
    () => [] as ToastItem[]
  );
  return (
    <div className="toasts">
      {items.map(t => (
        <div key={t.id} className="toast">
          <Icon name={t.type === "success" ? "check" : t.type === "error" ? "alert" : "info"} className={t.type === "success" ? "ic-ok" : t.type === "error" ? "ic-err" : "ic-info"} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------- Modal -------------------- */
interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  width?: number;
  className?: string;
}

export function Modal({ open, onClose, children, width = 480, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose && onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className={cx("modal", className)} style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* -------------------- Confirm -------------------- */
interface ConfirmOpts {
  title?: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  danger?: boolean;
}

export function useConfirm(): [(opts: ConfirmOpts) => Promise<boolean>, React.ReactNode] {
  const [state, setState] = useState<any>(null);
  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...opts, resolve })), []);
  const node = state ? (
    <Modal open onClose={() => { state.resolve(false); setState(null); }} width={400}>
      <div className="modal-head"><h3>{state.title || "Are you sure?"}</h3>
        <button className="btn-icon sm" onClick={() => { state.resolve(false); setState(null); }}><Icon name="x" /></button></div>
      <div className="modal-body"><p className="dim" style={{ fontSize: 13.5, lineHeight: 1.6 }}>{state.message}</p></div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={() => { state.resolve(false); setState(null); }}>{state.cancelText || "Cancel"}</button>
        <button className={cx("btn", state.danger ? "btn-danger" : "btn-primary")} onClick={() => { state.resolve(true); setState(null); }}>{state.confirmText || "Confirm"}</button>
      </div>
    </Modal>
  ) : null;
  return [confirm, node];
}

/* -------------------- Dropdown menu -------------------- */
interface MenuItem {
  sep?: boolean;
  danger?: boolean;
  icon?: string;
  label?: string;
  onClick?: () => void;
}

interface MenuProps {
  anchor: HTMLElement | null;
  onClose: () => void;
  items: MenuItem[];
}

export function Menu({ anchor, onClose, items }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const r = anchor.getBoundingClientRect();
    const mw = ref.current.offsetWidth, mh = ref.current.offsetHeight;
    let left = r.right - mw, top = r.bottom + 5;
    if (left < 8) left = r.left;
    if (top + mh > window.innerHeight - 8) top = r.top - mh - 5;
    setPos({ top, left });
  }, [anchor]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return (
    <div className="menu" ref={ref} style={{ top: pos.top, left: pos.left }}>
      {items.map((it, i) => it.sep ? <div key={i} className="menu-sep" /> : (
        <div key={i} className={cx("menu-item", it.danger && "danger")} onClick={() => { onClose(); it.onClick && it.onClick(); }}>
          {it.icon && <Icon name={it.icon} />}<span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

export function useMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = (e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setAnchor(e.currentTarget); };
  const close = () => setAnchor(null);
  return { anchor, open, close, isOpen: !!anchor };
}

/* -------------------- Badges -------------------- */
export function StatusDot({ status, color, size = 8 }: { status?: string; color?: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", background: color || (status ? STATUS[status]?.color : "") || "#8b8b94", flex: "none", display: "inline-block" }} />;
}

export function PriorityBadge({ priority, withLabel = true }: { priority: string; withLabel?: boolean }) {
  const p = PRIORITY[priority] || PRIORITY.medium;
  return (
    <span className="prio" style={{ color: p.color }}>
      <span className="bars">
        {[0, 1, 2].map(i => <i key={i} style={{ background: i < p.bars ? p.color : undefined }} />)}
      </span>
      {withLabel && <span>{p.label}</span>}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag"><Icon name="tag" style={{ width: 10, height: 10 }} />{children}</span>;
}

export function DueBadge({ date, done }: { date: any; done: boolean }) {
  if (!date) return null;
  const st = dueState(date, done);
  return (
    <span className={cx("due", st)}>
      <Icon name={st === "over" ? "alert" : "calendar"} />
      {fmtDate(date)}
    </span>
  );
}

/* -------------------- Progress -------------------- */
export function Progress({ value, done, thin }: { value: number; done: boolean; thin?: boolean }) {
  return <div className={cx("prog", thin && "thin", done && "done")}><i style={{ width: Math.max(0, Math.min(100, value)) + "%" }} /></div>;
}

export function Ring({ value, size = 38, stroke = 3.5 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle className="bg" cx={size / 2} cy={size / 2} r={r} style={{ strokeWidth: stroke }} />
      <circle className="fg" cx={size / 2} cy={size / 2} r={r} style={{ strokeWidth: stroke, strokeDasharray: c, strokeDashoffset: off, stroke: value >= 100 ? "var(--s-done)" : "var(--accent)" }} />
    </svg>
  );
}

/* -------------------- Empty / Skeleton -------------------- */
interface EmptyProps {
  icon?: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

export function Empty({ icon = "inbox", title, sub, action }: EmptyProps) {
  return (
    <div className="empty">
      <div className="ic"><Icon name={icon} /></div>
      <h4>{title}</h4>
      {sub && <p>{sub}</p>}
      {action && <div className="mt8">{action}</div>}
    </div>
  );
}

interface SkeletonProps {
  w?: string | number;
  h?: string | number;
  r?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ w = "100%", h = 14, r = 6, style }: SkeletonProps) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/* -------------------- Markdown render -------------------- */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return <div className={cx("md", className)} dangerouslySetInnerHTML={{ __html: mdToHtml(source) }} />;
}

/* -------------------- helpers -------------------- */
export function taskProgress(task: any, done: boolean) {
  if (!task.subtasks || !task.subtasks.length) return done ? 100 : 0;
  return Math.round(task.subtasks.filter((s: any) => s.done).length / task.subtasks.length * 100);
}

export function projectProgress(state: any, projectId: string) {
  const project = state.projects.find((p: any) => p.id === projectId);
  const ts = state.tasks.filter((t: any) => t.projectId === projectId);
  if (!ts.length) return 0;
  return Math.round(ts.filter((t: any) => isDoneStatus(project, t.status)).length / ts.length * 100);
}

export function moduleProgress(state: any, moduleId: string) {
  const mod = state.modules.find((m: any) => m.id === moduleId);
  const project = mod && state.projects.find((p: any) => p.id === mod.projectId);
  const ts = state.tasks.filter((t: any) => t.moduleId === moduleId);
  if (!ts.length) return 0;
  return Math.round(ts.filter((t: any) => isDoneStatus(project, t.status)).length / ts.length * 100);
}

'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Icon } from '@/components/Icon'
import { toast } from '@/components/ui'
import { cx } from '@/lib/utils'
import { useStore } from '@/lib/store'

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const isLocked = lockedUntil > now;
  const remaining = Math.ceil((lockedUntil - now) / 1000);

  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [isLocked]);

  const submit = useCallback(async (value: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });
      if (res.ok) {
        localStorage.setItem('devboard_pin', value);
        onUnlock();
      } else {
        setErr(true);
        const next = attempts + 1;
        setAttempts(next);
        if (next >= 5) {
          setLockedUntil(Date.now() + 30000);
          setAttempts(0);
          toast("Too many attempts — locked for 30s", "error");
        }
        setTimeout(() => { setErr(false); setPin(""); }, 450);
      }
    } catch (e) {
      toast("Authentication request failed", "error");
      setErr(true);
      setTimeout(() => { setErr(false); setPin(""); }, 450);
    }
  }, [attempts, onUnlock]);

  const press = useCallback((digit: string) => {
    if (isLocked) return;
    setPin(prev => {
      if (prev.length >= 6) return prev;
      const next = prev + digit;
      if (next.length === 6) setTimeout(() => submit(next), 120);
      return next;
    });
  }, [isLocked, submit]);

  const back = useCallback(() => setPin(p => p.slice(0, -1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, back]);

  return (
    <div className="lock">
      <div className="lock-card">
        <div className="lock-logo"><Icon name="lock" /></div>
        <h2>Welcome back</h2>
        <p>{isLocked ? "Locked — too many attempts" : "Enter your 6-digit pincode"}</p>

        <div className={cx("pin-dots", err && "shake")}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className={cx("pin-dot", err && "err", i < pin.length && "filled")} />
          ))}
        </div>

        {isLocked ? (
          <div className="lock-locked">Try again in {remaining}s</div>
        ) : (
          <div className="pin-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} className="pin-key" onClick={() => press(String(n))}>{n}</button>
            ))}
            <button className="pin-key action" onClick={() => setPin("")}>Clear</button>
            <button className="pin-key" onClick={() => press("0")}>0</button>
            <button className="pin-key action" onClick={back}><Icon name="x" style={{ width: 18, height: 18 }} /></button>
          </div>
        )}

        <div className="lock-hint">DevBoard Pincode is verified securely on the server</div>
      </div>
    </div>
  );
}

/* auto-lock hook: locks after N minutes of inactivity */
export function useAutoLock(unlocked: boolean, onLock: () => void) {
  const autoLockMin = useStore(s => s.meta?.autoLockMin || 5);
  const timer = useRef<any>(null);
  useEffect(() => {
    if (!unlocked) return;
    const minutes = autoLockMin || 5;
    const reset = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { onLock(); toast("Locked due to inactivity", "info"); }, minutes * 60000);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer.current); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [unlocked, autoLockMin, onLock]);
}

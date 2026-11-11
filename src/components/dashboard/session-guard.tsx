'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { extendSession, logout } from '@/app/dashboard/actions';

const WARN_MS = 30_000;
const CHANNEL = 'aiz-session';
const FAR = Number.MAX_SAFE_INTEGER;

function clock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Warns 30 seconds before the admin session ends, with a live countdown.
 * The visitor can stay signed in (a fresh token is issued) or log out. At zero it signs out on its own.
 * Other open dashboard tabs follow along through a BroadcastChannel.
 */
export function SessionGuard({ expiresAt, serverNow }: { expiresAt: number; serverNow: number }) {
  // Server clock minus browser clock, so a wrong device clock does not move the warning.
  const skew = useRef(serverNow - Date.now());
  const channel = useRef<BroadcastChannel | null>(null);
  const [exp, setExp] = useState(expiresAt);
  const [left, setLeft] = useState(FAR);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  useEffect(() => {
    skew.current = serverNow - Date.now();
    setExp((prev) => Math.max(prev, expiresAt));
  }, [expiresAt, serverNow]);

  useEffect(() => {
    const tick = () => {
      const remaining = exp - (Date.now() + skew.current);
      if (remaining <= 0) {
        window.location.assign('/login?expired=1');
        return;
      }
      // Outside the warning window there is nothing to render, so avoid re-rendering every tick.
      setLeft(remaining <= WARN_MS + 1000 ? remaining : FAR);
    };
    tick();
    const id = window.setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [exp]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(CHANNEL);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent<{ type?: string; expiresAt?: number }>) => {
      if (e.data?.type === 'extended' && typeof e.data.expiresAt === 'number') {
        const next = e.data.expiresAt;
        setExp((prev) => Math.max(prev, next));
      }
      if (e.data?.type === 'logout') window.location.assign('/login');
    };
    return () => {
      ch.close();
      channel.current = null;
    };
  }, []);

  const stay = () =>
    start(async () => {
      setError('');
      const res = await extendSession();
      if (res.ok) {
        setExp(res.expiresAt);
        channel.current?.postMessage({ type: 'extended', expiresAt: res.expiresAt });
      } else {
        setError(res.message);
      }
    });

  const leave = () =>
    start(async () => {
      channel.current?.postMessage({ type: 'logout' });
      await logout();
    });

  const open = left <= WARN_MS;
  const seconds = Math.ceil(left / 1000);
  const spoken = seconds > 20 ? 30 : seconds > 10 ? 20 : seconds > 5 ? 10 : 5;

  return (
    <Modal
      open={open}
      // Escape must not hide the warning: the session keeps running out until one of the two buttons is used.
      onClose={() => {}}
      persistent
      title="Your session is about to expire"
      description="For your security you will be signed out automatically when the time runs out."
      footer={
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button onClick={leave} disabled={pending} icon={<LogOut className="size-4" aria-hidden="true" />}>
            Log out
          </Button>
          <Button variant="primary" onClick={stay} loading={pending} data-autofocus icon={<ShieldCheck className="size-4" aria-hidden="true" />}>
            Stay signed in
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <p role="timer" className="font-display text-5xl font-bold tabular-nums">
          {open ? clock(left) : '00:30'}
        </p>
        <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full origin-left rounded-full bg-gradient-to-r from-[#d4491a] to-[#ffa24a] transition-transform duration-500 ease-linear" style={{ transform: `scaleX(${open ? Math.max(0, left / WARN_MS) : 1})` }} />
        </div>
        <span className="sr-only" aria-live="polite">
          {open ? `Signing out in less than ${spoken} seconds.` : ''}
        </span>
        {error && (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

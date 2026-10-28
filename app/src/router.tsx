import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

/** Path routes under the Vite base (`/optcg-sim/`); GitHub Pages serves index.html as 404.html. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener('popstate', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('popstate', fn);
  };
};
const current = () => {
  const p = window.location.pathname;
  const rel = p.startsWith(BASE) ? p.slice(BASE.length) : p;
  return rel.replace(/\/+$/, '') || '/';
};

export function usePath(): string {
  return useSyncExternalStore(subscribe, current, () => '/');
}

export function navigate(to: string) {
  window.history.pushState(null, '', BASE + to);
  for (const fn of listeners) fn();
  window.scrollTo(0, 0);
}

export function Link({
  to,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={BASE + to} onClick={handle} {...rest} />;
}

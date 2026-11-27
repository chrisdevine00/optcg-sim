import { useEffect, type ReactNode } from 'react';
import { gateHeading, storeWanted, useStoreReady } from './ready.ts';

/**
 * M10 WP1: the wrapper a route opts into when it reads or writes saved data. Until the store is ready
 * it shows the page's heading (focused, so the title and focus are right at once) and a skeleton with
 * one polite status, "Opening your saved data…"; then the page mounts and its own heading takes over.
 * The page never mounts early, so a game cannot start against a store that is still opening. After the
 * 3 s cap `initStore` falls back to memory and marks ready; the store-status notice explains.
 * A path the route table does not gate (`storeWanted`) passes straight through.
 */
export interface StoreGateProps {
  children: ReactNode;
  /** What to show while the store opens, instead of the default skeleton. */
  fallback?: ReactNode;
  /** The route's path (`/play`, `/drills/...`), for the heading. */
  path?: string;
}

export function StoreGate({ children, fallback, path }: StoreGateProps) {
  const ready = useStoreReady();
  if (ready || (path !== undefined && !storeWanted(path))) return <>{children}</>;
  return <Waiting path={path ?? '/'} fallback={fallback} />;
}

function Waiting({ path, fallback }: { path: string; fallback?: ReactNode }) {
  const heading = gateHeading(path);
  useEffect(() => {
    document.title = `${heading} · OPTCG Sim`;
    document.getElementById('page-title')?.focus();
  }, [heading]);
  return (
    <main className="page" id="main" aria-labelledby="page-title" aria-busy="true">
      <h1 id="page-title" tabIndex={-1}>
        {heading}
      </h1>
      {fallback ?? (
        <>
          <p role="status" className="lede">
            Opening your saved data…
          </p>
          <div
            aria-hidden="true"
            style={{
              height: '12rem',
              maxWidth: '40rem',
              borderRadius: '0.5rem',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-line)',
            }}
          />
        </>
      )}
    </main>
  );
}

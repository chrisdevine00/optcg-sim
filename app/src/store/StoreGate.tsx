import type { ReactNode } from 'react';

/**
 * M10 WP0: the wrapper a route opts into when it needs the saved-data store (WP1 fills it: the page's
 * heading and a skeleton until the store is ready, then the page). Until then it renders its children,
 * so mounting it changes nothing. App.tsx mounts it around Play, Tutorial, Decks, Reviews, Progress,
 * Settings, Drills and the lesson pages; `path` is the route's path so WP1 can pick the heading.
 */
export interface StoreGateProps {
  children: ReactNode;
  /** What to show while the store opens, instead of the default heading and skeleton. */
  fallback?: ReactNode;
  /** The route's path (`/play`, `/drills/...`), for the heading. */
  path?: string;
}

export function StoreGate({ children }: StoreGateProps) {
  return <>{children}</>;
}

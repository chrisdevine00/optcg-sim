/**
 * M10 WP4: a route change moves focus to the page's `<h1>` (accessibility.md, "Learn, Progress": "each page's
 * `h1` takes focus on route change"). The M9 pages and About do it themselves; Home, Setup, Decks, Cards,
 * Reviews and Settings did not, so a keyboard or screen-reader user stayed on the link they pressed, in a page
 * that had gone. `Guard` mounts one of these after each route's content, inside the same Suspense boundary, so
 * it runs once the lazy page has rendered, after the page's own effects: a page that already moved focus
 * (a drill, the board's decision panel, About) keeps it.
 *
 * Not on the first load of the document (the browser's own start is the right place then), and not when focus
 * is already inside the page body: only when it is on `<body>` or on something the old route removed.
 */
import { useEffect } from 'react';
import { gateWasShown } from '../store/ready.ts';

/** True once the first route has rendered: the first load is not a route change. */
let booted = false;

export function RouteFocus({ path }: { path: string }) {
  useEffect(() => {
    if (!booted) {
      booted = true;
      // The first load is not a route change, unless the store gate held the page: its focused heading was
      // removed when the gate lifted, so focus is on <body> and goes to the page's own heading (M10-R11).
      if (!gateWasShown()) return;
    }
    const active = document.activeElement;
    const inPage = active && active !== document.body && document.body.contains(active);
    // Focus on the page's own controls, or on the app header (the link just pressed), is left alone only
    // when it is inside the main content; the header link that was pressed is the case this fixes.
    const main = document.getElementById('main');
    if (inPage && main?.contains(active)) return;
    if (inPage && active.closest('#decision, [role="dialog"], [role="alertdialog"]')) return;
    const h1 = document.getElementById('page-title') ?? main?.querySelector('h1');
    if (!(h1 instanceof HTMLElement)) return;
    if (!h1.hasAttribute('tabindex')) h1.tabIndex = -1;
    h1.focus({ preventScroll: false });
  }, [path]);
  return null;
}

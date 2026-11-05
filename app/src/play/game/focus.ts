import { useEffect } from 'react';

/**
 * One "focus after commit" rule (accessibility §4.3, WCAG 2.4.3): focus is never left on <body>
 * because the control that held it went away. Playing from the action menu, Done on a pick, the
 * order choice and the AI's "Next move" button all unmount the focused element (M3 pass F1).
 *
 * The rule: remember where focus last was in terms that survive a re-render, a zone and an
 * index, or "the decision panel". When the focused element leaves the page and focus has fallen
 * to <body>, put it back: on the same index in that zone (clamped; the card may have moved to
 * another zone, the slot is still the next best place), else on the decision heading. Focus
 * that the player moved to <body> on purpose (a click on empty board) is not touched, because
 * the element they left is still in the page.
 */
interface Spot {
  zone: string | null;
  index: number;
  decision: boolean;
}

const lostToBody = () => {
  const a = document.activeElement;
  return !a || a === document.body || a === document.documentElement;
};

/** True while a modal owns focus (a native dialog, the hotseat curtain): it restores focus itself. */
const modalOpen = () =>
  !!document.querySelector('dialog[open], .curtain, [role="dialog"][aria-modal="true"]');

export function spotOf(el: Element): Spot | null {
  const item = el.closest<HTMLElement>('[data-zone][data-item]');
  if (item) {
    const zone = item.dataset.zone ?? null;
    const items = [...document.querySelectorAll(`[data-zone="${zone}"][data-item]`)];
    return { zone, index: Math.max(0, items.indexOf(item)), decision: false };
  }
  if (el.closest('#decision')) return { zone: null, index: 0, decision: true };
  return null;
}

/** Where focus goes now. Exported for the unit test of the rule. */
export function rescueTarget(spot: Spot | null): HTMLElement | null {
  if (spot && !spot.decision && spot.zone) {
    const items = [
      ...document.querySelectorAll<HTMLElement>(`[data-zone="${spot.zone}"][data-item]`),
    ];
    const at = items[Math.min(spot.index, items.length - 1)];
    if (at) return at;
  }
  // While the AI moves at Step pace, its "Next move" is what the player acts on, and it sits in
  // the footer's role="application" strip, so NVDA passes `.` through; on the heading, browse
  // mode takes `.` and nothing happens (M3 re-run F15).
  // It is aria-disabled, never disabled, while the AI moves, so it stays focusable.
  const next = document.getElementById('next-btn');
  if (next) return next;
  return document.getElementById('decision-title');
}

export function useFocusRescue(): void {
  useEffect(() => {
    let spot: Spot | null = null;
    let tracked: Element | null = null;
    const onIn = (e: FocusEvent) => {
      const t = e.target as Element | null;
      if (!t || t === document.body) return;
      tracked = t;
      // A menu or dialog keeps the spot of the card that opened it.
      spot = spotOf(t) ?? spot;
    };
    const check = () => {
      if (!tracked || tracked.isConnected || !lostToBody() || modalOpen()) return;
      tracked = null;
      const to = rescueTarget(spot);
      to?.focus({ preventScroll: false });
    };
    // Mutations are batched into one microtask; the check then runs after React has committed.
    const obs = new MutationObserver(() => queueMicrotask(check));
    const root = document.querySelector('main.play') ?? document.body;
    obs.observe(root, { childList: true, subtree: true });
    document.addEventListener('focusin', onIn);
    return () => {
      obs.disconnect();
      document.removeEventListener('focusin', onIn);
    };
  }, []);
}

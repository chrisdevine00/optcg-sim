/**
 * M10 WP0: the routes the Lighthouse run measures (scripts/lighthouse.ts), as data so WP2 and the
 * nightly name the same six. `path` is relative to the app's base (`/optcg-sim/`). The play route
 * is the Setup screen of the late-game scenario (scenario names: app/src/play/setup/scenarios.ts).
 */
export interface PerfRoute {
  name: string;
  path: string;
  notes: string;
}

export const PERF_ROUTES: readonly PerfRoute[] = [
  { name: 'home', path: '', notes: 'The landing page: first visit, no saved data.' },
  { name: 'cards', path: 'cards', notes: 'The card browser; loads the card data chunk.' },
  {
    name: 'play',
    path: 'play?scenario=late&opp=pirate&speed=step',
    notes: 'The game route (Setup with the late-game scenario); the AI worker spawns on Start.',
  },
  { name: 'meta', path: 'meta', notes: 'The Meta Explorer.' },
  { name: 'learn', path: 'learn', notes: 'The Learn hub.' },
  { name: 'rules', path: 'rules', notes: 'The rules reference.' },
];

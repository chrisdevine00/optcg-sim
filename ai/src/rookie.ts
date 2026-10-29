/**
 * Rookie (ARCHITECTURE §4.2): a uniformly random legal action, except that it always blocks or
 * counters an attack that would win the game. It sees only its own `PlayerView` and picks only from
 * `view.actions`, with a seeded RNG (never `Math.random`).
 */
import {
  nextInt,
  seedRng,
  type Action,
  type CardId,
  type PlayerView,
  type ProjectedView,
  type RngState,
  type ViewCard,
} from '@optcg/engine';
import { minimal, type Explanation } from './explanation.ts';

export interface Decided {
  action: Action;
  explanation: Explanation;
  alternatives: Action[];
}

export interface RookieContext {
  /** Seed for this one decision (the store derives it from the game seed and the action index). */
  seed: number;
  /** Printed Counter value of a card, or null. Card data is public. */
  counterOf: (card: CardId) => number | null;
}

type Battle = ProjectedView['battle'];

function battleOf(view: PlayerView): Battle {
  return (view as Partial<ProjectedView>).battle ?? null;
}

function cardByHandle(view: PlayerView, handle: string): ViewCard | undefined {
  for (const p of ['p1', 'p2'] as const) {
    for (const zone of Object.values(view.zones[p])) {
      const c = zone.find((x) => x.handle === handle);
      if (c) return c;
    }
  }
  return undefined;
}

/**
 * True when the attack in progress wins the game if nothing changes: it targets this player's
 * Leader, this player has 0 Life, and the attacker's power is at least the Leader's (ties go to the
 * attacker, CR 7-1-4-1; damage at 0 Life loses, CR 7-1-4-1-1-1).
 */
export function attackIsLethal(view: PlayerView): boolean {
  const b = battleOf(view);
  if (!b) return false;
  const me = view.player;
  const leader = view.zones[me].leader[0];
  if (!leader || b.target !== leader.handle) return false;
  if (view.zones[me].life.length > 0) return false;
  const attacker = cardByHandle(view, b.attacker);
  return (attacker?.power ?? 0) >= (leader.power ?? 0);
}

function pick<T>(items: readonly T[], rng: RngState): [T, RngState] {
  const [i, next] = nextInt(rng, items.length);
  return [items[i]!, next];
}

export function rookie(view: PlayerView, ctx: RookieContext): Decided {
  // Never concede: a random concession would end games for no reason.
  const options = view.actions.filter((a) => a.type !== 'concede');
  if (options.length === 0) throw new Error('Rookie was asked to decide with no legal action.');
  const rng: RngState = seedRng(ctx.seed);
  const kind = view.decision?.kind;

  if (attackIsLethal(view)) {
    if (kind === 'block') {
      const blocks = options.filter((a) => a.type === 'block' && a.blocker !== null);
      if (blocks.length > 0) {
        const [action] = pick(blocks, rng);
        return decided(action, options, 'lethal-defence', 'Blocked an attack that would win.');
      }
    }
    if (kind === 'counter') {
      const target = battleOf(view)!.target;
      const counters = options.filter(
        (a): a is Extract<Action, { type: 'counter' }> =>
          a.type === 'counter' && a.target === target,
      );
      if (counters.length > 0) {
        // The largest Counter first, so the fewest cards stop the attack.
        const value = (a: Extract<Action, { type: 'counter' }>) =>
          ctx.counterOf(cardByHandle(view, a.card)?.card ?? '') ?? 0;
        const best = Math.max(...counters.map(value));
        const top = counters.filter((a) => value(a) === best);
        const [action] = pick(top, rng);
        return decided(action, options, 'lethal-defence', 'Countered an attack that would win.');
      }
    }
  }

  const [action] = pick(options, rng);
  return decided(action, options, 'random', 'Rookie picked a random legal move.');
}

function decided(action: Action, _options: Action[], conceptId: string, claim: string): Decided {
  return { action, explanation: minimal(conceptId, claim), alternatives: [] };
}

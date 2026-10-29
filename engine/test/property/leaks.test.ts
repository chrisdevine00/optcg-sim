/**
 * Hidden-information leak properties (ADR 0005, ARCHITECTURE §2.7; review findings M2-01..M2-03,
 * M2-10). Games start from real meta decks with injected [Trigger] scripts on a third of the card
 * ids and some Life cards face up, so damage decisions and visible-to-hidden-to-visible moves occur.
 *
 * 1. Indistinguishability: permuting the cards hidden from a viewer, including a Life card waiting
 *    on a damage decision, changes neither that viewer's view nor `autoSkip` for an observing human.
 * 2. Events: the same action from both states projects to the same events for that viewer (card
 *    ids aside, which legitimate reveals may show).
 * 3. Linkage: a card that passed through a zone hidden from a viewer never shows that viewer a
 *    handle it showed before, in views or in projected events.
 */
import fc from 'fast-check';
import { SCRIPTED_IDS } from '@optcg/cards';
import { describe, expect, it } from 'vitest';
import {
  autoSkip,
  createFromScenario,
  ENGINE_VERSION,
  cardsVersionOf,
  project,
  projectEvents,
  reduce,
  SCRIPTS_VERSION,
  nextInt,
  seedRng,
  shuffle,
  type Action,
  type CardPlacement,
  type GameEvent,
  type GameRecord,
  type GameState,
  type PlayerId,
} from '../../src/index.ts';
import { CARD_FIELDS, INSTANCE_ID_ANYWHERE } from '../../src/draft.ts';
import { canSee } from '../../src/project.ts';
import { internals, withAbilities } from '../../src/testing.ts';
import type { State } from '../../src/state.ts';
import { cards } from '../fixtures/index.ts';
import { metaDecks } from '../support/decks.ts';
import { playFrom, type RandomGame } from '../support/random-game.ts';
import { propertySeed } from '../support/seed.ts';

const RUNS = Math.max(30, Math.ceil(Number(process.env.ENGINE_GAMES ?? 500) / 15));
const PLAYERS: PlayerId[] = ['p1', 'p2'];

/** A turn-1 game from two meta decks with scripted [Trigger]s and some face-up Life. */
export function leakGame(
  seed: number,
  keepStates = true,
  onEvents?: (ev: GameEvent[], after: GameState) => void,
): RandomGame {
  let rng = seedRng(seed);
  const all = metaDecks();
  const pickDeck = (): number => {
    let v: number;
    [v, rng] = nextInt(rng, all.length);
    return v;
  };
  // One side always plays a scripted archetype (Rocks or Kaido), so effect choices over hidden
  // zones (a search of the deck, a cost paid from hand, a forced pick) occur (M2-19).
  const scripted = all
    .map((d, i) => (d.leader === 'OP17-039' || d.leader === 'OP17-058' ? i : -1))
    .filter((i) => i >= 0);
  const a = scripted[seed % scripted.length]!;
  const b = pickDeck();
  const spec = (i: number) => {
    let main: string[];
    [main, rng] = shuffle(all[i]!.main, rng);
    const life: CardPlacement[] = main.slice(5, 9).map((card) => {
      let v: number;
      [v, rng] = nextInt(rng, 3);
      return { card, faceUp: v === 0 };
    });
    return { leader: all[i]!.leader, hand: main.slice(0, 5), life, deck: main.slice(9) };
  };
  const scenario = {
    seed,
    turn: 1,
    activePlayer: 'p1' as const,
    firstPlayer: 'p1' as const,
    phase: 'refresh' as const,
    p1: spec(a),
    p2: spec(b),
  };
  let state = createFromScenario({ ...scenario, cards: cards() }).state;
  const ids = [...new Set([...all[a]!.main, ...all[b]!.main])].sort();
  for (const id of ids) {
    let v: number;
    [v, rng] = nextInt(rng, 3);
    if (v === 0)
      state = withAbilities(state, id, [
        { id: 't', kind: 'trigger', effect: [{ op: 'emit', label: 'trig' }] },
      ]);
  }
  const record: GameRecord = {
    versions: { engine: ENGINE_VERSION, cards: cardsVersionOf(state), scripts: SCRIPTS_VERSION },
    start: { scenario },
    actions: [],
  };
  return playFrom(state, record, rng, { seed, keepStates, invariants: false, onEvents });
}

/** Ids `viewer` cannot see. A Life card on a damage decision is hidden from the non-owner only. */
function hiddenFrom(s: State, viewer: PlayerId): string[] {
  const top = s.stack[s.stack.length - 1];
  const pending = top?.f === 'damage' ? top.pending : null;
  // A card whose play is in progress was revealed when it was paid for (CR 2-7-2); both players
  // know it, though it is still in hand until placed (M4a-06).
  const playing = new Set(s.stack.flatMap((f) => (f.f === 'play' ? [f.card] : [])));
  return Object.keys(s.cards).filter(
    (id) =>
      !canSee(s, id, viewer) &&
      !playing.has(id) &&
      !(id === pending && s.cards[id]!.owner === viewer),
  );
}

function permuted(s: State, viewer: PlayerId, order: number[]): State {
  const cardsCopy = { ...s.cards };
  for (const owner of PLAYERS) {
    const ids = hiddenFrom(s, viewer).filter((id) => s.cards[id]!.owner === owner);
    const printed = ids.map((id) => s.cards[id]!.card);
    const perm = ids
      .map((_, i) => i)
      .sort((x, y) => (order[x % order.length] ?? 0) - (order[y % order.length] ?? 0) || x - y);
    ids.forEach((id, i) => (cardsCopy[id] = { ...cardsCopy[id]!, card: printed[perm[i]!]! }));
  }
  return { ...s, cards: cardsCopy };
}

/** Does this projected event show the viewer a card that was hidden from them? */
const isReveal = (e: GameEvent): boolean =>
  e.type === 'CardRevealed' ||
  e.type === 'TriggerRevealed' ||
  (e.type === 'CardMoved' &&
    (e.revealed === true || (e.instance === undefined && e.newInstance !== undefined)));

/** Projected events up to and including the first one that shows the viewer a hidden card. */
function untilReveal(events: GameEvent[]): GameEvent[] {
  const i = events.findIndex(isReveal);
  return i < 0 ? events : events.slice(0, i + 1);
}

const stripCards = (events: GameEvent[]): string =>
  JSON.stringify(events.map(({ card: _c, lki: _l, targetCard: _t, label: _x, ...rest }) => rest));

describe('hidden-information leak properties', () => {
  it('views and observed autoSkip are invariant under hidden permutations, including a pending damage card (M2-01, M2-02)', () => {
    let damageStates = 0;
    let secretChoices = 0;
    let forcedChecks = 0;
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 0x7fffffff }),
        fc.array(fc.nat(), { minLength: 64, maxLength: 64 }),
        (seed, order) => {
          const game = leakGame(seed);
          game.states.forEach((g, i) => {
            const k = internals(g).decision;
            if (i % 3 !== 0 && k?.kind !== 'trigger' && !k?.secret) return;
            const s = internals(g);
            if (s.decision?.kind === 'trigger') damageStates++;
            if (s.decision?.secret && s.decision.kind === 'choose') secretChoices++;
            for (const viewer of PLAYERS) {
              const other = permuted(s, viewer, order) as unknown as GameState;
              expect(JSON.stringify(project(other, viewer))).toBe(
                JSON.stringify(project(g, viewer)),
              );
              if (s.decision && s.decision.player !== viewer)
                expect(autoSkip(other, { observedByOtherHuman: true })).toEqual(
                  autoSkip(g, { observedByOtherHuman: true }),
                );
              // The same action from both states projects to the same events for the viewer.
              const action = game.record.actions[i];
              // Playing a card, a Counter or an activated [Trigger] reveals the card: skip those.
              if (!action || action.type === 'playCard' || action.type === 'counter') continue;
              if (action.type === 'trigger' && action.activate) continue;
              let a: GameEvent[];
              let b: GameEvent[];
              let ra: GameState;
              let rb: GameState;
              try {
                ({ events: a, state: ra } = reduce(g, action));
                ({ events: b, state: rb } = reduce(other, action));
              } catch {
                continue; // the action needs a hidden card the permutation changed
              }
              // The decision that follows, asked of the other player, must pause (or not) the same
              // way whatever the hidden cards are, unless a hidden card was revealed (M2-19).
              const pv = projectEvents(a, viewer);
              const nextDec = internals(ra).decision;
              if (nextDec && nextDec.player !== viewer && !pv.some(isReveal)) {
                expect(autoSkip(rb, { observedByOtherHuman: true })).toEqual(
                  autoSkip(ra, { observedByOtherHuman: true }),
                );
                forcedChecks++;
              }
              // Once a hidden card is revealed to the viewer, what follows may legitimately depend
              // on which card it was (a reveal's condition, a play's [On Play]): compare up to and
              // including the first reveal.
              const pa = untilReveal(projectEvents(a, viewer));
              const pb = untilReveal(projectEvents(b, viewer)).slice(0, pa.length);
              // Card ids too must match before the reveal (a leaked id would differ, M4a-06);
              // only the reveal itself may show a different card.
              const head =
                pa.length > 0 && isReveal(pa[pa.length - 1]!) ? pa.length - 1 : pa.length;
              expect(JSON.stringify(pb.slice(0, head))).toBe(JSON.stringify(pa.slice(0, head)));
              expect(stripCards(pb.slice(head))).toBe(stripCards(pa.slice(head)));
            }
          });
        },
      ),
      { numRuns: RUNS, seed: propertySeed(200) },
    );
    expect(damageStates).toBeGreaterThan(0);
    // Choices over hidden zones were exercised, including observed autoSkip on them (M2-19).
    if (SCRIPTED_IDS.has('OP17-039')) expect(secretChoices).toBeGreaterThan(0);
    expect(forcedChecks).toBeGreaterThan(0);
  }, 600_000);

  it('a handle never links a card across a zone hidden from the viewer, and no projected event holds a raw id (M2-03, M2-17)', () => {
    let relinks = 0;
    let rawChecked = 0;
    let returns = 0;
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 0x7fffffff }), (seed) => {
        const seen: Record<PlayerId, Map<string, Set<string>>> = { p1: new Map(), p2: new Map() };
        const hiddenSince: Record<PlayerId, Set<string>> = { p1: new Set(), p2: new Set() };
        const revealedInHand: Record<PlayerId, Set<string>> = { p1: new Set(), p2: new Set() };
        const note = (v: PlayerId, id: string, h: string, where: string): void => {
          const set = seen[v].get(id) ?? new Set<string>();
          if (hiddenSince[v].has(id)) {
            returns++;
            if (set.has(h)) {
              relinks++;
              throw new Error(`seed ${seed}: ${v} relinked ${id} by handle ${h} (${where})`);
            }
          }
          set.add(h);
          seen[v].set(id, set);
          hiddenSince[v].delete(id);
        };
        const observeState = (g: GameState): void => {
          const s = internals(g);
          for (const v of PLAYERS) {
            const view = project(g, v);
            for (const p of PLAYERS) {
              for (const [zone, list] of Object.entries(view.zones[p])) {
                const ids =
                  zone === 'leader'
                    ? [s.players[p].leader]
                    : ((s.players[p] as unknown as Record<string, string[]>)[zone] ?? []);
                list.forEach((vc, i) => {
                  const id = ids[i];
                  if (!id) return;
                  if (vc.card === null) {
                    // A card revealed from hand stays known while it stays there (ARCH §2.7).
                    const known = zone === 'hand' && revealedInHand[v].has(id);
                    if (seen[v].has(id) && !known) hiddenSince[v].add(id);
                  } else {
                    note(v, id, vc.handle, `view ${p}.${zone}`);
                    revealedInHand[v].delete(id);
                  }
                });
              }
            }
          }
        };
        leakGame(seed, false, (events: GameEvent[], after) => {
          for (const v of PLAYERS) {
            const projected = projectEvents(events, v);
            // M2-17: no projected event carries a raw instance id, live or dead.
            const raw = JSON.stringify(projected).match(INSTANCE_ID_ANYWHERE);
            if (raw) throw new Error(`seed ${seed}: raw instance id ${raw[0]} projected to ${v}`);
            rawChecked++;
            projected.forEach((pe, i) => {
              const raw = events[i]!;
              for (const f of CARD_FIELDS) {
                const h = pe[f];
                const id = raw[f];
                if (typeof h === 'string' && typeof id === 'string' && h !== id) {
                  note(v, id, h, `event ${raw.type}.${f}`);
                  if (raw.type === 'CardRevealed') revealedInHand[v].add(id);
                }
              }
            });
          }
          observeState(after);
        });
      }),
      { numRuns: RUNS, seed: propertySeed(300) },
    );
    expect(relinks).toBe(0);
    expect(returns).toBeGreaterThan(0); // cards did come back from hidden zones
    expect(rawChecked).toBeGreaterThan(0);
  }, 600_000);
});

export type { Action };

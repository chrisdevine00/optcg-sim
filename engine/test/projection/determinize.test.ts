/**
 * Determinization support (M5a, ADR 0005, ARCHITECTURE §4.3): `projectForSearch` and `determinize`.
 *
 * 1. Round trip: filling every hidden card with the card that is really there gives a state with
 *    the same cards in the same places, the same decision and the same legal actions (in the
 *    viewer's handles), and clean invariants.
 * 2. A wrong fill changes only hidden cards: the decider's legal actions are the same whatever
 *    the hidden cards are (the AI cannot learn anything from them that its view did not show).
 * 3. Opaque skeletons are rare, and `determinize` refuses them.
 * The leak property (permuting hidden cards leaves the skeleton unchanged) is in
 * test/property/leaks.test.ts with the other indistinguishability checks.
 */
import { describe, expect, it } from 'vitest';
import {
  checkInvariants,
  determinize,
  legalActions,
  projectForSearch,
  CannotDeterminize,
  type Action,
  type GameState,
  type PlayerId,
  type SearchView,
} from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import { metaDecks } from '../support/decks.ts';
import { playRandomGame } from '../support/random-game.ts';

const PLAYERS: PlayerId[] = ['p1', 'p2'];

/** The positional handle → card id map that is really there. */
function trueFill(g: GameState, view: SearchView): Record<string, string> {
  const s = internals(g);
  const out: Record<string, string> = {};
  for (const pos of Object.values(view.skeleton.hidden)) {
    const [p, zone, i] = pos.split('.') as [PlayerId, string, string];
    const list =
      zone === 'resolving'
        ? s.resolving
        : (s.players[p] as unknown as Record<string, string[]>)[zone]!;
    out[pos] = s.cards[list[Number(i)]!]!.card;
  }
  return out;
}

/** Re-express a determinized state's action in the view's handles. */
function toView(a: Action, handles: Record<string, string>): Action {
  return JSON.parse(
    JSON.stringify(a).replace(/\$[a-z0-9]{7}/g, (id) => handles[id] ?? id),
  ) as Action;
}

const strip = ({ intentId: _i, ...a }: Action) => a;
const sortJson = (xs: unknown[]) => xs.map((x) => JSON.stringify(x)).sort();

/** Card ids per zone position, for both players. */
function layout(g: GameState): string {
  const s = internals(g);
  return JSON.stringify(
    PLAYERS.map((p) => {
      const ps = s.players[p];
      return [
        ps.leader,
        ...ps.characters,
        '|',
        ...ps.hand,
        '|',
        ...ps.life,
        '|',
        ...ps.deck,
        '|',
        ...ps.trash,
      ].map((id) =>
        id === '|'
          ? id
          : `${s.cards[id]!.card}${s.cards[id]!.rested ? 'r' : ''}${s.cards[id]!.don}`,
      );
    }),
  );
}

describe('projectForSearch and determinize (M5a)', () => {
  it('round-trips: the true fill rebuilds the same cards, decision and legal actions', () => {
    const decks = metaDecks();
    const scripted = decks
      .map((d, i) => (d.leader === 'OP17-039' || d.leader === 'OP17-058' ? i : -1))
      .filter((i) => i >= 0);
    let checked = 0;
    let opaque = 0;
    for (let g = 0; g < 6; g++) {
      const game = playRandomGame({
        seed: 900 + g,
        decks: [scripted[g % scripted.length]!, scripted[(g + 1) % scripted.length]!],
        keepStates: true,
        invariants: false,
      });
      game.states.forEach((state, i) => {
        if (i % 4 !== 0) return;
        const s = internals(state);
        if (!s.decision) return;
        const viewer = s.decision.player;
        const view = projectForSearch(state, viewer);
        if (view.skeleton.opaque) {
          opaque++;
          expect(() => determinize(view, trueFill(state, view), cards(), 1)).toThrow(
            CannotDeterminize,
          );
          return;
        }
        const det = determinize(view, trueFill(state, view), cards(), 1);
        expect(checkInvariants(det)).toEqual([]);
        expect(layout(det)).toBe(layout(state));
        expect(internals(det).decision?.kind).toBe(s.decision.kind);
        const fromDet = legalActions(det).map((a) => strip(toView(a, view.skeleton.handles)));
        expect(sortJson(fromDet)).toEqual(sortJson(view.actions.map(strip)));
        checked++;
      });
    }
    expect(checked).toBeGreaterThan(200);
    // Opaque skeletons (a public reference to a hidden card) are rare.
    expect(opaque).toBeLessThan(checked / 20);
  });

  it('the decider’s legal actions do not depend on the hidden cards chosen by the fill', () => {
    const decks = metaDecks();
    const kaido = decks.findIndex((d) => d.leader === 'OP17-058');
    const rocks = decks.findIndex((d) => d.leader === 'OP17-039');
    const game = playRandomGame({ seed: 77, decks: [rocks, kaido], keepStates: true });
    let checked = 0;
    game.states.forEach((state, i) => {
      if (i % 3 !== 0) return;
      const s = internals(state);
      if (!s.decision) return;
      const view = projectForSearch(state, s.decision.player);
      if (view.skeleton.opaque) return;
      const fill = trueFill(state, view);
      // Reverse the order of the hidden cards: a different, equally legal guess.
      const keys = Object.keys(fill);
      const values = keys.map((k) => fill[k]!).reverse();
      const wrong = Object.fromEntries(keys.map((k, j) => [k, values[j]!]));
      const a = legalActions(determinize(view, fill, cards(), 3));
      const b = legalActions(determinize(view, wrong, cards(), 3));
      expect(sortJson(b.map(strip))).toEqual(sortJson(a.map(strip)));
      checked++;
    });
    expect(checked).toBeGreaterThan(50);
  });

  it('refuses a fill that leaves a hidden card out', () => {
    const decks = metaDecks();
    const game = playRandomGame({ seed: 5, decks: [0, 1], keepStates: true });
    const state = game.states[30]!;
    const view = projectForSearch(state, internals(state).decision!.player);
    const fill = trueFill(state, view);
    Reflect.deleteProperty(fill, Object.keys(fill)[0]!);
    expect(() => determinize(view, fill, cards(), 1)).toThrow(CannotDeterminize);
    expect(decks.length).toBeGreaterThan(1);
  });
});

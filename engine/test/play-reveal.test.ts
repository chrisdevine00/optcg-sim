/**
 * A card being played is revealed when it is paid for (CR 2-7-2), so while it waits at the
 * "Character area is full" prompt the opponent may know it (OP15-R7). The view, the search
 * skeleton and the leak property agree on that; nothing else in the hand shows, not even where the
 * played card sat in it (ADR 0005).
 */
import { describe, expect, it } from 'vitest';
import { project, projectForSearch, type CardId, type GameState } from '../src/index.ts';
import type { ProjectedView } from '../src/project.ts';
import { internals } from '../src/testing.ts';
import {
  BLUE,
  expectDecision,
  game,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  times,
  V,
} from './cards/helpers.ts';
import type { TestGame } from './fixtures/index.ts';

/** p1 plays `played` from `hand` with a full Character area; p1 must choose a Character to trash. */
function midPlay(hand: CardId[], played: CardId): TestGame {
  const g = game(
    {
      leader: PLAIN_BLUE,
      hand,
      characters: times(5, BLUE),
      costArea: { active: 8, rested: 0 },
    },
    { leader: PLAIN_PURPLE, hand: [V.c1, V.c2] },
  );
  play(g, played);
  const d = expectDecision(g, 'choose', 'p1');
  expect(d.purpose).toBe('characterLimit');
  return g;
}

/** Handles hash the instance id, which differs between scenarios that order the hand differently. */
const plain = (json: string): string => json.replace(/"h[0-9a-f]{12}"/g, '"h"');
const view = (g: TestGame) => plain(JSON.stringify(project(g.state, 'p2')));
const skel = (g: TestGame) => plain(JSON.stringify(projectForSearch(g.state, 'p2').skeleton));
const shownHand = (g: TestGame) => project(g.state, 'p2').zones.p1.hand;

describe('a card being played is public while the play waits', () => {
  it('two positions differing only in the played card: the opponent sees which', () => {
    const a = midPlay([V.c3, V.c1], V.c3);
    const b = midPlay([V.c4, V.c1], V.c4);
    expect(shownHand(a).map((c) => c.card)).toEqual([V.c3, null]);
    expect(shownHand(b).map((c) => c.card)).toEqual([V.c4, null]);
    expect(view(a)).not.toBe(view(b));
    expect(skel(a)).not.toBe(skel(b));
    // The skeleton carries what the view shows, under the same handle.
    const sk = projectForSearch(a.state, 'p2').skeleton;
    expect(Object.values(sk.handles)).toContain(shownHand(a)[0]!.handle);
  });

  it('two positions differing only in an unrelated hidden hand card: identical views and skeletons', () => {
    const a = midPlay([V.c3, V.c1], V.c3);
    const b = midPlay([V.c3, V.c5], V.c3);
    expect(view(a)).toBe(view(b));
    expect(skel(a)).toBe(skel(b));
  });

  it('where the played card sat in the hand does not show', () => {
    const a = midPlay([V.c3, V.c1, V.c2], V.c3);
    const b = midPlay([V.c1, V.c3, V.c2], V.c3);
    const c = midPlay([V.c1, V.c2, V.c3], V.c3);
    expect(view(a)).toBe(view(b));
    expect(view(a)).toBe(view(c));
    expect(skel(a)).toBe(skel(b));
    expect(skel(a)).toBe(skel(c));
    const hand = shownHand(a);
    expect(hand.map((x) => x.card)).toEqual([V.c3, null, null]);
    expect(hand.slice(1).map((x) => x.handle)).toEqual(['p1.hand.0', 'p1.hand.1']);
  });
});

describe('a Life card the viewer knows is in the view and the skeleton alike', () => {
  const withKnownLife = (card: CardId, know: boolean): GameState => {
    const g = game({ leader: PLAIN_BLUE }, { leader: PLAIN_PURPLE, life: [card, V.c1, V.c2] });
    const s = internals(g.state);
    const id = s.players.p2.life[0]!;
    return { ...s, known: { ...s.known, p1: know ? [id] : [] } } as unknown as GameState;
  };
  const both = (s: GameState) => [
    JSON.stringify(project(s, 'p1')),
    JSON.stringify(projectForSearch(s, 'p1').skeleton),
  ];

  it('positions differing only in the known card differ in both', () => {
    const [va, ka] = both(withKnownLife(V.c3, true));
    const [vb, kb] = both(withKnownLife(V.c4, true));
    expect(va).not.toBe(vb);
    expect(ka).not.toBe(kb);
    expect((project(withKnownLife(V.c3, true), 'p1') as ProjectedView).known).toEqual({
      'p2.life.0': V.c3,
    });
  });

  it('positions differing only in an unknown Life card are identical in both', () => {
    const [va, ka] = both(withKnownLife(V.c3, false));
    const [vb, kb] = both(withKnownLife(V.c4, false));
    expect(va).toBe(vb);
    expect(ka).toBe(kb);
  });
});

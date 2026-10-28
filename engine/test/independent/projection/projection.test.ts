/**
 * Hidden information in `project()` (CR 3-2-2, 3-4-2, 3-4-3, 3-5-2, 3-7-2, 3-10-2, 3-10-2-1;
 * ARCHITECTURE §2.7).
 *
 * `PlayerView` exposes only `player`, `decision` and `actions` as typed fields, so these tests
 * inspect the whole serialized view: a hidden card must leave no trace of its card id or its
 * instance id anywhere in it. Each hidden zone uses a card id that appears nowhere else, so a
 * match can only come from that zone.
 *
 * Cards (all vanilla): p1 hand OP01-023 Marco; p1 deck OP02-007 Thatch; p1 Life OP02-020
 * LittleOars Jr.; p2 hand OP01-092 Urashima; p2 deck OP01-110 Fukurokuju; p2 face-down Life
 * OP01-107 Babanuki; p2 face-up Life OP02-077 Solitaire; p2 Character OP01-103 Scratchmen Apoo;
 * p2 trash OP02-080 Dobon.
 */
import { describe, expect, it } from 'vitest';
import { project, type InstanceId, type PlayerId } from '@optcg/engine';
import { scenario, type TestGame } from '../../fixtures/index.ts';
import { fill, L, V } from '../helpers.ts';

const P1_HAND = V.marco;
const P1_DECK = V.thatch;
const P1_LIFE = V.littleOars;
const P2_HAND = V.urashima;
const P2_DECK = V.fukurokuju;
const P2_LIFE_DOWN = V.babanuki;
const P2_LIFE_UP = V.solitaire;
const P2_CHAR = V.apoo;
const P2_TRASH = V.dobon;

function position(p2Hand: string[] = [P2_HAND, P2_HAND], p2Deck: string[] = fill(P2_DECK, 8)) {
  return scenario({
    p1: {
      leader: L.redLuffy,
      hand: [P1_HAND],
      deck: fill(P1_DECK, 8),
      life: fill(P1_LIFE, 5),
    },
    p2: {
      leader: L.purpleKaido,
      hand: p2Hand,
      deck: p2Deck,
      life: [{ card: P2_LIFE_UP, faceUp: true }, ...fill(P2_LIFE_DOWN, 4)],
      characters: [P2_CHAR],
      trash: [P2_TRASH],
    },
  });
}

const view = (g: TestGame, p: PlayerId) => JSON.stringify(project(g.state, p));
const quoted = (s: string) => `"${s}"`;
const instances = (g: TestGame, p: PlayerId, zone: Parameters<TestGame['zone']>[1]): InstanceId[] =>
  g.zone(p, zone).map((c) => c.instance);

describe('projection hides secret information', () => {
  it('CR 3-4-3: the opponent’s hand is hidden (no card id, no instance id)', () => {
    const g = position();
    const v = view(g, 'p1');
    expect(v).not.toContain(quoted(P2_HAND));
    for (const id of instances(g, 'p2', 'hand')) expect(v).not.toContain(quoted(id));
  });

  it('CR 3-2-2: both decks are hidden from both players', () => {
    const g = position();
    for (const p of ['p1', 'p2'] as const) {
      const v = view(g, p);
      expect(v).not.toContain(quoted(P1_DECK));
      expect(v).not.toContain(quoted(P2_DECK));
      for (const owner of ['p1', 'p2'] as const) {
        for (const id of instances(g, owner, 'deck')) expect(v).not.toContain(quoted(id));
      }
    }
  });

  it('CR 3-10-2: face-down Life is hidden from both players, including its owner', () => {
    const g = position();
    for (const p of ['p1', 'p2'] as const) {
      const v = view(g, p);
      expect(v).not.toContain(quoted(P1_LIFE));
      expect(v).not.toContain(quoted(P2_LIFE_DOWN));
    }
  });

  it('ARCHITECTURE §2.7: a view never shows engine instance ids', () => {
    const g = position();
    const all = (['p1', 'p2'] as const).flatMap((owner) =>
      (['hand', 'deck', 'life', 'leader', 'characters', 'trash'] as const).flatMap((z) =>
        instances(g, owner, z),
      ),
    );
    for (const p of ['p1', 'p2'] as const) {
      const v = view(g, p);
      for (const id of all) expect(v).not.toContain(quoted(id));
    }
  });

  it('ARCHITECTURE §2.7: positions that differ only in the opponent’s hidden cards project identically', () => {
    // Same structure; p2's hand and deck swap which hidden card is where.
    const a = position([P2_HAND, P2_HAND], fill(P2_DECK, 8));
    const b = position([P2_DECK, P2_HAND], [P2_HAND, ...fill(P2_DECK, 7)]);
    expect(project(b.state, 'p1')).toEqual(project(a.state, 'p1'));
  });
});

describe('projection shows open information', () => {
  it('CR 3-4-2: a player sees their own hand', () => {
    const g = position();
    expect(view(g, 'p1')).toContain(quoted(P1_HAND));
    expect(view(g, 'p2')).toContain(quoted(P2_HAND));
  });

  it('CR 3-7-2 / 3-5-2: Characters and the trash are visible to both players', () => {
    const g = position();
    for (const p of ['p1', 'p2'] as const) {
      const v = view(g, p);
      expect(v).toContain(quoted(P2_CHAR));
      expect(v).toContain(quoted(P2_TRASH));
    }
  });

  it('CR 3-10-2-1: a face-up Life card is visible to both players', () => {
    const g = position();
    for (const p of ['p1', 'p2'] as const) expect(view(g, p)).toContain(quoted(P2_LIFE_UP));
  });

  it('PlayerView: only the deciding player is offered actions', () => {
    const g = position();
    expect(project(g.state, 'p1').decision).toMatchObject({ kind: 'main', player: 'p1' });
    expect(project(g.state, 'p1').actions.length).toBeGreaterThan(0);
    expect(project(g.state, 'p2').actions).toEqual([]);
  });
});

/** ST19-001 Smoker. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, trash, V } from './helpers.ts';
import { BLACK_NONNAVY, BN1, BN2, NAVY_LEADER, RN5, mk, offered } from './helpers-st1821.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'ST19-001';

/** Smoker (cost 6) plus a black {Navy} card in hand; p2 has Characters of cost 2, 3, 4, 5. */
const start = (hand: string[] = [ID, BN1]): TestGame =>
  mk(
    { leader: NAVY_LEADER, hand },
    { characters: [V.c2, V.c3, V.c4, V.c5], deck: [V.c1, V.c1, V.c1, V.c1, V.c1, V.c1] },
  );
const locked = (g: TestGame, card: string): boolean =>
  g.card(g.find('p2', 'characters', card)).cannotAttack === true;

describe('ST19-001 Smoker', () => {
  it('[On Play]: trashes a black {Navy} card from hand, then up to 2 Characters of cost 4 or less cannot attack', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BN1)]);
    expect(trash(g, 'p1')).toEqual([BN1]);
    // Cost 5 is not offered; cost 4 (the boundary), 3 and 2 are.
    expectDecision(g, 'choose', 'p1');
    expect(offered(g)).toHaveLength(3);
    expect(offered(g)).not.toContain(g.find('p2', 'characters', V.c5));
    pick(g, [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c2)]);
    expect(locked(g, V.c4)).toBe(true);
    expect(locked(g, V.c2)).toBe(true);
    expect(locked(g, V.c3)).toBe(false);
    expect(locked(g, V.c5)).toBe(false);
  });

  it("the lock lasts through the opponent's whole next turn and ends with it", () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BN1)]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'endTurn' });
    // p2's turn: the locked Character cannot attack, an unlocked one can.
    const c4 = g.find('p2', 'characters', V.c4);
    const c3 = g.find('p2', 'characters', V.c3);
    const can = (attacker: string) =>
      g.isLegal({ type: 'attack', attacker, target: g.leader('p1'), player: 'p2' });
    expect(can(c4)).toBe(false);
    expect(can(c3)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    // p2's following turn: the lock is gone.
    expect(can(c4)).toBe(true);
  });

  it('only a black {Navy} card pays: a red {Navy} card or a black non-{Navy} card cannot (the prompt is shown, accepting is illegal)', () => {
    const g = start([ID, RN5, BLACK_NONNAVY]);
    play(g, ID);
    // The prompt is shown (it must not depend on the hidden hand) but only declining is legal.
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(locked(g, V.c4)).toBe(false);
  });

  it('declining the cost trashes nothing and locks nothing; with two cost cards the owner picks one', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(locked(g, V.c4)).toBe(false);
    const h = start([ID, BN1, BN2]);
    play(h, ID);
    accept(h);
    expect(offered(h).sort()).toEqual(
      [h.find('p1', 'hand', BN1), h.find('p1', 'hand', BN2)].sort(),
    );
    pick(h, [h.find('p1', 'hand', BN2)]);
    expect(trash(h, 'p1')).toEqual([BN2]);
  });

  it('"up to 2": may pick fewer (none)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BN1)]);
    none(g);
    expect(locked(g, V.c4)).toBe(false);
    expect(locked(g, V.c2)).toBe(false);
  });
});

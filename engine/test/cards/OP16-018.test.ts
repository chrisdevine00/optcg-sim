/** OP16-018 Rockstar. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { ids } from './helpers-hancock-rosi.ts';
import { canAccept, offers, RED_LEADER, RHP6, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-018';

describe('OP16-018 Rockstar', () => {
  /** p2's 9000 Character attacks p1's rested [Red-Haired Pirates] Character `RHP6` (Rockstar is also on the field). */
  const attacked = (handCards: string[], target: string = RHP6, extra: string[] = []) => {
    const g = game(
      {
        leader: RED_LEADER,
        hand: handCards,
        characters: [ID, { card: target, rested: true }],
      },
      { leader: PLAIN_BLUE, characters: [V.c7, ...extra] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', target),
    });
    passBlock(g);
    endCounter(g);
    return g;
  };

  it("if your {Red-Haired Pirates} Character would be K.O.'d, you may trash 1 Character card with 6000 power or more from your hand instead", () => {
    const g = attacked([V.c4, V.c1]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(offers(g, g.find('p1', 'hand', V.c4))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, RHP6]);
    expect(trash(g, 'p1')).toEqual([V.c4]);
  });

  it('threshold: a 5000 power Character cannot be trashed for it (6000 can)', () => {
    const g = attacked([V.c3]);
    expect(canAccept(g)).toBe(false);
    const g2 = attacked([V.c4]);
    expect(canAccept(g2)).toBe(true);
  });

  it('declining lets the Character be K.O.d', () => {
    const g = attacked([WB8]);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([RHP6]);
    expect(hand(g, 'p1')).toEqual([WB8]);
  });

  it('a Character that is not {Red-Haired Pirates} is not protected', () => {
    const g = attacked([WB8], V.c5);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(trash(g, 'p1')).toEqual([V.c5]);
  });

  it('is Once Per Turn: a second K.O. in the same turn is not replaced', () => {
    const g = attacked([V.c4, V.c4], RHP6, [V.c6]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    // The second attack (8000) K.O.s the same Character again; the replacement was spent, so nothing is offered.
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c6),
      target: g.find('p1', 'characters', RHP6),
    });
    passBlock(g);
    endCounter(g);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([RHP6, V.c4]); // top of the trash first
  });
});

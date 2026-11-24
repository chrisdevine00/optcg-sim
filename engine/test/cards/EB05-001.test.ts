/** EB05-001 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'EB05-001';
/** ST01-001 Monkey.D.Luffy Leader ({Supernovas}). Characters with 2000 power: OP14-102, OP08-104. */
const SUPERNOVAS = SHC_LEADER;
const S1 = 'OP14-102';
const S2 = 'OP08-104';

describe('EB05-001 Jewelry Bonney', () => {
  const start = (leader: string, handExtra: string[]) =>
    game(
      { leader, hand: [ID, ...handExtra], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: with a {Supernovas} Leader, draw 2 and play up to 2 Characters with 2000 power or less from your hand', () => {
    const g = start(SUPERNOVAS, [S1, S2, V.c1]);
    play(g, ID);
    // 2 cards drawn first (hand: S1, S2, c1 + 2 drawn).
    expect(hand(g, 'p1')).toHaveLength(5);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', S1), g.find('p1', 'hand', S2)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, S1, S2].sort());
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('plays at most 2, only cards with 2000 power or less, and "up to": it may play fewer', () => {
    const g = start(SUPERNOVAS, [S1, S2, V.c1]);
    play(g, ID);
    // The 3000 power Characters (V.c1 and the drawn cards) are not candidates.
    const candidates = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(candidates.sort()).toEqual([g.find('p1', 'hand', S1), g.find('p1', 'hand', S2)].sort());
    pick(g, [g.find('p1', 'hand', S2)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, S2].sort());
  });

  it('it may play nothing, but the 2 cards are still drawn', () => {
    const g = start(SUPERNOVAS, [S1]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('does nothing without a {Supernovas} Leader: no draw, no play', () => {
    const g = start(PLAIN_PURPLE, [S1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([S1]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const active = (opp: Parameters<typeof game>[1]['characters']) =>
      game({ leader: SUPERNOVAS, characters: [ID] }, { leader: PLAIN_BLUE, characters: opp });

    it("gives up to 1 of your opponent's Leader or Characters with 6000 power or more -1000 power until the end of your opponent's next End Phase", () => {
      const g = active([V.c4, V.c2]);
      const bonney = g.find('p1', 'characters', ID);
      g.act({ type: 'activate', card: bonney, ability: 'debuff' });
      // Candidates: the 6000 Character only (the 5000 Leader and the 4000 Character are below 6000).
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
      const target = g.find('p2', 'characters', V.c4);
      pick(g, [target]);
      expect(g.power(target)).toBe(5000);
      g.act({ type: 'endTurn' });
      // Still reduced during the opponent's turn.
      expect(g.power(target)).toBe(5000);
      g.act({ type: 'endTurn' });
      expect(g.power(target)).toBe(6000);
    });

    it('a Leader below 6000 power is not a target: with nothing to choose, nothing is asked', () => {
      const g = active([V.c2]);
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'debuff' });
      expectDecision(g, 'main', 'p1');
      expect(g.power(g.leader('p2'))).toBe(5000);
    });

    it('is Once Per Turn', () => {
      const g = active([V.c4]);
      const bonney = g.find('p1', 'characters', ID);
      g.act({ type: 'activate', card: bonney, ability: 'debuff' });
      none(g);
      expect(g.isLegal({ type: 'activate', card: bonney, ability: 'debuff', player: 'p1' })).toBe(
        false,
      );
    });
  });
});

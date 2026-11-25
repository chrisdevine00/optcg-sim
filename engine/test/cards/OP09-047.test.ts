/** OP09-047 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  pick,
  trash,
  V,
} from './helpers.ts';
import { koBy, koByEffect, mk } from './helpers-a09g2.ts';

const ID = 'OP09-047';
/** {Giant}{Thriller Bark Pirates} vanilla, cost 8 / 10000. */
const TBP8 = 'OP14-101';

describe('OP09-047 Kouzuki Oden', () => {
  it('has [Double Attack]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Double Attack');
  });

  it('[On K.O.]: draws 2 cards, then trashes 1 card from the 3-card hand', () => {
    const g = mk({ characters: [ID], hand: [V.c1], deck: [V.c2, V.c3, V.c4] });
    koByEffect(g, 'p1', ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, V.c3]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3); // a drawn card too
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c3].sort());
  });

  it("also triggers when K.O.'d in battle", () => {
    // a 10000-power attacker: Oden himself has 10000 power
    const g = game(
      {
        leader: 'ST01-001',
        characters: [{ card: ID, rested: true }],
        hand: [V.c1],
        deck: [V.c2, V.c3, V.c4],
      },
      { leader: PLAIN_BLUE, characters: [TBP8] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', TBP8),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    expect(hand(g, 'p1')).toHaveLength(3);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2, V.c3]);
  });

  it('fires for a K.O. by your own effect too', () => {
    const g = mk({ characters: [ID], hand: [V.c1], deck: [V.c2, V.c3, V.c4] });
    koBy(g, 'p1', ID, 'p1');
    expectDecision(g, 'choose', 'p1');
  });

  it('with an empty hand the 2 drawn cards are the only ones to trash from', () => {
    const g = mk({ characters: [ID], deck: [V.c2, V.c3, V.c4] });
    koByEffect(g, 'p1', ID);
    expect(hand(g, 'p1')).toEqual([V.c2, V.c3]);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(dec(g)?.kind).toBe('main');
  });
});

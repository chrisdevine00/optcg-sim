/** OP14-029 Tashigi. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { activate, offeredAb } from './helpers-w3s.ts';
import { mk } from './helpers-op14g1.ts';

const ID = 'OP14-029';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const noDon = { active: 0, rested: 0 };

/** p2's turn; p2 K.O.s Tashigi (or `target`). */
const byOpponent = (target = ID) => {
  const g = mk({ characters: [ID, V.c1], costArea: noDon }, {}, { turn: 4, activePlayer: 'p2' });
  plantOpponentEffect(g, koOne);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP14-029 Tashigi', () => {
  it("[Opponent's Turn]: instead of being removed by the opponent's effect, you may rest 1 of your cards", () => {
    const g = byOpponent();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.leader('p1')]);
    expect(chars(g)).toContain(ID);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('she may rest herself; declining lets the K.O. happen', () => {
    const g = byOpponent();
    accept(g);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    const h = byOpponent();
    decline(h);
    expect(chars(h)).not.toContain(ID);
  });

  it('must not protect other Characters, nor apply to her own turn or her own effects', () => {
    const g = byOpponent(V.c1);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).not.toContain(V.c1);

    const own = mk({ characters: [ID] }, {}, {});
    own.state = applyOp(own.state, {
      op: 'ko',
      card: own.find('p1', 'characters', ID),
      by: 'p2',
    }).state;
    expect(chars(own)).not.toContain(ID);

    const self = mk({ characters: [ID] }, {}, { turn: 4, activePlayer: 'p2' });
    self.state = applyOp(self.state, {
      op: 'ko',
      card: self.find('p1', 'characters', ID),
      by: 'p1',
    }).state;
    expect(chars(self)).not.toContain(ID);
  });

  it('with nothing active to rest the replacement is not offered', () => {
    const g = mk(
      {
        characters: [{ card: ID, rested: true }],
        leader: { card: 'ST01-001', rested: true },
        costArea: noDon,
      },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(chars(g)).not.toContain(ID);
  });

  describe('[Activate: Main] [Once Per Turn] rest 2 cards: +2000 power until the end of the opponent next End Phase', () => {
    const start = () => mk({ characters: [ID, V.c1], costArea: noDon });

    it('rests 2 chosen cards and gives +2000', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'boost');
      pick(g, [g.leader('p1'), g.find('p1', 'characters', V.c1)]);
      expect(g.card(g.leader('p1')).rested).toBe(true);
      expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
    });

    it('lasts through the opponent next turn and ends after their End Phase', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'boost');
      pick(g, [g.leader('p1'), g.find('p1', 'characters', V.c1)]);
      g.act({ type: 'endTurn' });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
      g.act({ type: 'endTurn' });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    });

    it('needs 2 active cards: with only 1 it is not offered; Once Per Turn', () => {
      const g = mk({
        characters: [ID],
        leader: { card: 'ST01-001', rested: true },
        costArea: noDon,
      });
      expect(offeredAb(g, g.find('p1', 'characters', ID), 'boost')).toBe(false);
      const h = start();
      activate(h, h.find('p1', 'characters', ID), 'boost');
      pick(h, [h.leader('p1'), h.find('p1', 'characters', V.c1)]);
      expect(offeredAb(h, h.find('p1', 'characters', ID), 'boost')).toBe(false);
    });

    it('Tashigi may rest herself as one of the 2 cards', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'boost');
      pick(g, [g.find('p1', 'characters', ID), g.leader('p1')]);
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
    });
  });
});

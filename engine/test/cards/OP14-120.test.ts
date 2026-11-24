/** OP14-120 Crocodile. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { plant } from './helpers-op15g2.ts';
import { canAttack, canAccept } from './helpers-op16g1.ts';
import { BW_LEADER, COST8, ids, koByEffect, start } from './helpers-op14g4.ts';

const ID = 'OP14-120';
const COST10 = 'P-041';
type G = ReturnType<typeof start>;

describe('OP14-120 Crocodile', () => {
  const played = (p2chars: string[]) => {
    const g = start(
      {
        leader: BW_LEADER,
        hand: [ID],
        deck: [BLUE, BLUE, BLUE],
        costArea: { active: 8, rested: 0 },
      },
      { characters: p2chars },
    );
    play(g, ID);
    return g;
  };
  const can = (g: G, card: string) =>
    canAttack(g, g.find('p2', 'characters', card), g.leader('p1'));

  it("[On Play] a cost 9 or less Character cannot attack until the end of the opponent's next End Phase", () => {
    const g = played([V.c7, V.c4]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c7)]);
    g.act({ type: 'endTurn' });
    expect(can(g, V.c7)).toBe(false);
    expect(can(g, V.c4)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(can(g, V.c7)).toBe(true);
  });

  it('cost 10 is not a candidate', () => {
    const g = played([COST10, V.c7]);
    const o = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(o).toEqual([g.find('p2', 'characters', V.c7)]);
    none(g);
  });

  it('then, with an opposing cost 8 Character, draws 1 (even if no target was chosen)', () => {
    const g = played([COST8, V.c4]);
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('a cost 7 Character is not enough: no draw', () => {
    const g = played([V.c7]);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('an opposing cost 0 Character (a cost reduction) also draws; your own cost 8 Character does not', () => {
    const g = start(
      {
        leader: BW_LEADER,
        hand: [ID],
        characters: [COST8],
        deck: [BLUE, BLUE],
        costArea: { active: 8, rested: 0 },
      },
      { characters: [V.c1] },
    );
    plant(g, 'p1', {
      cost: {
        target: { from: 'characters', owner: 'opponent' },
        amount: -1,
        duration: 'thisTurn',
      },
    });
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);

    const h = start(
      {
        leader: BW_LEADER,
        hand: [ID],
        characters: [COST8],
        deck: [BLUE, BLUE],
        costArea: { active: 8, rested: 0 },
      },
      { characters: [V.c4] },
    );
    play(h, ID);
    none(h);
    expect(hand(h, 'p1')).toEqual([]);
  });

  describe('[On K.O.]', () => {
    const koed = (handCards: string[]) => {
      const g = start({ leader: BW_LEADER, characters: [ID], hand: handCards });
      koByEffect(g, 'p1', ID);
      return g;
    };

    it('you may trash 1 card from your hand: play this Character card from your trash', () => {
      const g = koed([V.c1, V.c2]);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      expect(ids(g, 'p1', 'trash')).toEqual([V.c1]);
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('declining leaves it in the trash and the hand intact', () => {
      const g = koed([V.c1]);
      decline(g);
      expect(ids(g, 'p1', 'characters')).toEqual([]);
      expect(ids(g, 'p1', 'trash')).toEqual([ID]);
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });

    it('with an empty hand the cost cannot be paid', () => {
      const g = koed([]);
      expectDecision(g, 'optional', 'p1');
      expect(canAccept(g)).toBe(false);
    });

    it('the replayed Crocodile triggers [On Play] again', () => {
      const g = start(
        { leader: BW_LEADER, characters: [ID], hand: [V.c1], deck: [BLUE, BLUE] },
        { characters: [COST8] },
      );
      koByEffect(g, 'p1', ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      // Played from the trash by an effect: its [On Play] asks for a target, then draws (cost 8 on the opposing field).
      none(g);
      expect(hand(g, 'p1')).toEqual([BLUE]);
    });
  });
});

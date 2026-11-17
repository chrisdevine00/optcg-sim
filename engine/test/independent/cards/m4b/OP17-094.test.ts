/**
 * OP17-094 Rodo (Character, Black, cost 1, 2000, Counter +2000; Giant / Elbaph / New Giant Pirates).
 *
 * Card text: "If your Leader has the {Elbaph} type, this Character gains +12 cost."
 *
 * Rules: CR 8-1-3-3 (permanent effect); QA-OP17 OP17-085 / OP17-089 (RL-43): a "+12 cost" on the
 * Character itself applies only on the field, not in hand. Scenery: OP17-079 (Elbaph Leader),
 * ST06-001 (Navy Leader, no Elbaph), OP17-090 Franky ("K.O. up to 1 of your opponent's Characters
 * with a cost of 2 or less" with a cost-12 Character on the field).
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  choiceCards,
  choose,
  costOf,
  kind,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  side,
  theirTurn,
} from './kit-d.ts';

const RODO = 'OP17-094';
const FRANKY = 'OP17-090';
const DORRY = 'OP17-089';

describe('OP17-094 Rodo: +12 cost with an Elbaph Leader', () => {
  it('Elbaph Leader: cost 13 on the field', () => {
    const g = myTurn(side(LD.elbaph, BLUE, { characters: [RODO] }), side(LEAD.luffy, RED));
    expect(costOf(g, g.find('p1', 'characters', RODO))).toBe(13);
  });

  it('non-Elbaph Leader: cost stays 1', () => {
    const g = myTurn(side(LD.navy, BLUE, { characters: [RODO] }), side(LEAD.luffy, RED));
    expect(costOf(g, g.find('p1', 'characters', RODO))).toBe(1);
  });

  it('the condition is on YOUR Leader: an Elbaph opposing Leader changes nothing', () => {
    const g = myTurn(side(LD.navy, BLUE, { characters: [RODO] }), side(LD.elbaph, RED));
    expect(costOf(g, g.find('p1', 'characters', RODO))).toBe(1);
  });

  it('in hand the bonus does not apply (cost 1): it can be played for 1 DON!!', () => {
    const g = myTurn(
      side(LD.elbaph, BLUE, { hand: [RODO], costArea: { active: 1, rested: 0 } }),
      side(LEAD.luffy, RED),
    );
    expect(costOf(g, g.find('p1', 'hand', RODO))).toBe(1);
    playFromHand(g, RODO);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([RODO]);
    expect(costOf(g, g.find('p1', 'characters', RODO))).toBe(13);
  });

  it('while cost 13 it is out of reach of "cost of 2 or less" K.O.; at cost 1 it is a legal target', () => {
    // p2's turn: p2 plays Franky (cost-12 Saul on p2's field) and may K.O. a cost <=2 Character.
    const mk = (leader: string) =>
      theirTurn(
        side(leader, BLUE, { characters: [RODO] }),
        side(LEAD.luffy, RED, {
          hand: [FRANKY],
          characters: [DORRY],
          costArea: { active: 2, rested: 0 },
        }),
      );
    const hi = mk(LD.elbaph);
    playFromHand(hi, FRANKY, 'p2');
    expect(kind(hi)).not.toBe('choose'); // nothing eligible, so nothing to choose
    expect(hi.zone('p1', 'characters')).toHaveLength(1);

    const lo = mk(LD.navy);
    playFromHand(lo, FRANKY, 'p2');
    expect(choiceCards(lo)).toEqual([RODO]);
    choose(lo, [lo.find('p1', 'characters', RODO)]);
    expect(lo.zone('p1', 'characters')).toHaveLength(0);
  });
});

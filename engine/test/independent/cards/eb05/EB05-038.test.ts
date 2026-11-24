/**
 * EB05-038 Russian (Character, Purple, cost 1, 0 power, Counter +2000, {Senor Pink's Wife}).
 *
 * Card text: "[On Play] Up to 1 of your [Senor Pink] cards gains +3000 power during this turn."
 *
 * Rules: CR 2-1-2 (a card name in brackets is exact), CR 8-4-4-1 ("up to" may choose 0), RL-09
 * ("during this turn" ends with the turn), "your cards" are cards on my field.
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import {
  CH,
  choiceCards,
  choose,
  chooseNone,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
} from './kit-b.ts';

const ID = 'EB05-038';

function go(own: string[], opp: string[] = []) {
  const g = mine(LD.donq, { hand: [ID], characters: own }, { characters: opp });
  playCard(g, ID);
  return g;
}

describe('EB05-038 Russian [On Play]: up to 1 of my [Senor Pink] cards gets +3000 power this turn', () => {
  it('the chosen [Senor Pink] gains +3000 (5000 -> 8000)', () => {
    const g = go([CH.pink]);
    const pink = g.find('p1', 'characters', CH.pink);
    expect(choiceCards(g)).toEqual([CH.pink]);
    choose(g, [pink]);
    expect(g.power(pink)).toBe(8000);
  });

  it('only cards named [Senor Pink] are candidates: not other Characters, not my Leader, not Russian herself', () => {
    const g = go([CH.pink, CH.sai, CH.mohji]);
    expect(choiceCards(g)).toEqual([CH.pink]);
  });

  it('the opponent’s [Senor Pink] is not a candidate (my cards only)', () => {
    const g = go([CH.pink], [CH.pink2]);
    expect(choiceCards(g)).toEqual([CH.pink]);
  });

  it('"up to 1": choosing nothing leaves every power unchanged', () => {
    const g = go([CH.pink]);
    chooseNone(g);
    expect(g.power(g.find('p1', 'characters', CH.pink))).toBe(5000);
  });

  it('two different [Senor Pink] cards: only one may be chosen', () => {
    const g = go([CH.pink, CH.pink2]);
    expect(choiceCards(g)).toEqual([CH.pink, CH.pink2].sort());
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    const second = g.find('p1', 'characters', CH.pink2);
    choose(g, [second]);
    expect(g.power(second)).toBe(9000);
    expect(g.power(g.find('p1', 'characters', CH.pink))).toBe(5000);
  });

  it('with no [Senor Pink] on my field nothing is asked and nothing changes', () => {
    const g = go([CH.sai]);
    expect(kind(g)).toBe('main');
    expect(g.power(g.find('p1', 'characters', CH.sai))).toBe(4000);
  });

  it('RL-09: the +3000 ends with the turn (back to 5000 on the opponent’s turn)', () => {
    const g = go([CH.pink]);
    const pink = g.find('p1', 'characters', CH.pink);
    choose(g, [pink]);
    expect(g.power(pink)).toBe(8000);
    endTurn(g);
    expect(g.power(pink)).toBe(5000);
  });

  it('Russian’s own power is 0 and she is unaffected', () => {
    const g = go([CH.pink]);
    choose(g, [g.find('p1', 'characters', CH.pink)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
  });
});

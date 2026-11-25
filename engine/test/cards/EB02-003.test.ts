/** EB02-003 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { canPick, C1, C2, don, expectDecision, mk, pick, NAVY_LEADER } from './helpers-aeb2g1.ts';
import { dec, play } from './helpers.ts';

const ID = 'EB02-003';

describe('EB02-003 Tony Tony.Chopper', () => {
  it('[On Play] with a {Straw Hat Crew} Leader: gives 1 rested DON!! to the Leader or a Character', () => {
    const g = mk({ hand: [ID], characters: [C1], costArea: { active: 5, rested: 2 } });
    play(g, ID);
    // The play cost (3) rests 3 DON!!: there are rested DON!! to give.
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', C1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    pick(g, [g.find('p1', 'characters', C1)]);
    expect(g.card(g.find('p1', 'characters', C1)).don).toBe(1);
    expect(don(g, 'p1').given).toBe(1);
  });

  it('[On Play] without a {Straw Hat Crew} Leader nothing is given', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID], costArea: { active: 5, rested: 2 } });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1').given).toBe(0);
  });

  it("[On Play]: can give the DON!! to this Character, and the opponent's cards are not offered", () => {
    const g = mk({ hand: [ID], costArea: { active: 3, rested: 0 } }, { characters: [C2] });
    play(g, ID); // pays 3: the 3 DON!! are rested now
    expect(canPick(g, g.find('p2', 'characters', C2))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
  });

  it('the played cost rests 3 DON!!; the one given is one of those rested ones', () => {
    const g = mk({ hand: [ID], costArea: { active: 3, rested: 0 } });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2, given: 1 });
  });

  it("[DON!! x2][Opponent's Turn]: +2000 power only with 2 DON!! given, only on the opponent's turn", () => {
    const g = mk({
      characters: [
        { card: ID, don: 1 },
        { card: ID, don: 2 },
      ],
      costArea: { active: 3, rested: 0 },
    });
    const one = g.find('p1', 'characters', ID, 0);
    const two = g.find('p1', 'characters', ID, 1);
    expect(g.power(one)).toBe(4000); // my turn: 3000 + 1000 (1 DON!!)
    expect(g.power(two)).toBe(5000); // my turn: 3000 + 2000 (2 DON!!), no +2000
    g.act({ type: 'endTurn' }); // opponent's turn: given DON!! give nothing
    expect(g.power(one)).toBe(3000);
    expect(g.power(two)).toBe(5000); // 3000 + 2000 (effect)
  });
});

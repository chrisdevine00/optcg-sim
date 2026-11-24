/**
 * EB05-044 Ms. Father's Day (Character, Black, cost 2, 2000, Counter +2000, {Baroque Works}).
 *
 * Card text: "[On Play] If your Leader's type includes "Baroque Works" and your opponent has a
 * Character with a cost of 0, give your opponent's Leader -1000 power during this turn."
 *
 * Rules: CR 8-3-3 (failed "if"), CR 1-3-6-2 (a cost below 0 is treated as 0, so -3 on a cost-1
 * Character makes it 0), RL-09 ("during this turn"). No printed Character has cost 0, so the tests
 * make one with EB05-049 Special Hollow (cost -3 this turn; it is scripted, and no other scripted
 * card lowers an opposing cost).
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import { CH, drive, EV, LD, mainEvent, mine, playCard } from './kit-b.ts';

const ID = 'EB05-044';

/** p1 plays Special Hollow (K.O.ing its own Gecko Moria) on `target`, then plays Father's Day. */
function go(o: { leader?: string; target?: string | null; opp?: string[] } = {}) {
  const opp = o.opp ?? [CH.mohji];
  const target = o.target === undefined ? opp[0]! : o.target;
  const g = mine(
    o.leader ?? LD.bw,
    { hand: [EV.hollow, ID], characters: [CH.moria] },
    { characters: opp },
  );
  if (target) {
    mainEvent(g, g.find('p1', 'hand', EV.hollow), {
      cost: [g.find('p1', 'characters', CH.moria)],
      picks: [[g.find('p2', 'characters', target)]],
    });
    expect(g.card(g.find('p2', 'characters', target)).cost).toBe(
      Math.max(0, (target === CH.mohji ? 1 : target === CH.hajrudin ? 4 : 0) - 3),
    );
  }
  playCard(g, ID);
  drive(g, 'p1', {});
  return g;
}

describe("EB05-044 Ms. Father's Day [On Play]: Baroque Works Leader and an opposing cost-0 Character: opposing Leader -1000", () => {
  it('Baroque Works Leader and a cost-0 Character: the opposing Leader goes from 5000 to 4000', () => {
    const g = go();
    expect(g.power(g.leader('p2'))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-3: with no cost-0 Character on the opposing side nothing happens', () => {
    const g = go({ target: null });
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('boundary: a Character of cost 1 does not count (Hajrudin cost 4 - 3 = 1)', () => {
    const g = go({ opp: [CH.hajrudin], target: CH.hajrudin });
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('CR 8-3-3: a Leader whose type lacks "Baroque Works" (ST01-001) gets no effect even with a cost-0 Character', () => {
    const g = go({ leader: LD.shc });
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('one cost-0 Character is enough; other cost-1 Characters add nothing (-1000 once)', () => {
    const g = go({ opp: [CH.mohji, CH.komachiyo] });
    expect(g.power(g.leader('p2'))).toBe(4000);
  });

  it('the -1000 targets only the opposing Leader: not my Leader, not any Character', () => {
    const g = go({ opp: [CH.mohji, CH.sai] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', CH.sai))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', CH.mohji))).toBe(3000);
  });

  it('RL-09: the -1000 ends with the turn (5000 again on the opponent’s turn)', () => {
    const g = go();
    endTurn(g);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('Father’s Day herself is cost 2: she does not make a cost-0 Character for herself, and stays on the field', () => {
    const g = go({ target: null });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ID);
  });
});

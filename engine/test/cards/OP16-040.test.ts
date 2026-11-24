/** OP16-040 Gum-Gum Hammer Rifle. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { counterStep, endCounter, useCounter } from './helpers-luffyace.ts';
import { GREEN_LEADER, IMPEL_LEADER, LUFFY_034, mine, mineOther, MR3_G } from './helpers-op16g2.ts';

const ID = 'OP16-040';
const rested = (c: string) => ({ card: c, rested: true });

describe('OP16-040 Gum-Gum Hammer Rifle', () => {
  it('[Main] with [Monkey.D.Luffy] and [Mr.3(Galdino)]: an opposing rested Character with a cost of 6 or less will not become active in their next Refresh Phase', () => {
    const g = mine(
      { hand: [ID], characters: [MR3_G] },
      { characters: [rested(V.c6), rested(V.c5)] },
    );
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true); // stays rested
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false); // refreshed
  });

  it('a Character with a cost of 7 is not a candidate, and neither is an active one', () => {
    const g = mine({ hand: [ID], characters: [MR3_G] }, { characters: [rested(V.c7), V.c3] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expectDecision(g, 'main', 'p1');
  });

  it('[Monkey.D.Luffy] may be a Character instead of the Leader', () => {
    const g = mineOther(
      { hand: [ID], characters: [MR3_G, LUFFY_034] },
      { characters: [rested(V.c4)] },
      GREEN_LEADER,
    );
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
  });

  it('without [Mr.3(Galdino)] nothing happens', () => {
    const g = mine({ hand: [ID] }, { characters: [rested(V.c4)] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('without [Monkey.D.Luffy] nothing happens', () => {
    const g = mineOther({ hand: [ID], characters: [MR3_G] }, { characters: [rested(V.c4)] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": may choose none', () => {
    const g = mine({ hand: [ID], characters: [MR3_G] }, { characters: [rested(V.c4)] });
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = counterStep(
      { leader: IMPEL_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } },
      {},
      V.c6,
    );
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
  });
});

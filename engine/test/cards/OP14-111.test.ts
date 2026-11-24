/** OP14-111 Perona. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canAttack } from './helpers-op16g1.ts';
import { koedInBattle } from './helpers-op15g2.ts';
import { describeTbpTrigger, koByEffect, OTHER_LEADER, start } from './helpers-op14g4.ts';

const ID = 'OP14-111';
type G = ReturnType<typeof start>;
const can = (g: G, card: string) => canAttack(g, g.find('p2', 'characters', card), g.leader('p1'));
const offeredIds = (g: G) =>
  g
    .legal()
    .filter((a) => a.type === 'pick')
    .map((a) => (a.type === 'pick' ? a.choice : null));

describe('OP14-111 Perona', () => {
  const played = () => {
    const g = start(
      { leader: OTHER_LEADER, hand: [ID], costArea: { active: 4, rested: 0 } },
      { characters: [V.c6, V.c7, V.c4] },
    );
    play(g, ID);
    return g;
  };

  it("[On Play] a cost 6 Character cannot attack until the end of the opponent's next End Phase, then can again", () => {
    const g = played();
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c6)]);
    g.act({ type: 'endTurn' });
    expect(can(g, V.c6)).toBe(false);
    expect(can(g, V.c4)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(can(g, V.c6)).toBe(true);
  });

  it('cost 6 is the limit: a cost 7 Character is not a candidate', () => {
    const g = played();
    const ids = offeredIds(g);
    expect(ids).toContain(g.find('p2', 'characters', V.c6));
    expect(ids).toContain(g.find('p2', 'characters', V.c4));
    expect(ids).not.toContain(g.find('p2', 'characters', V.c7));
    none(g);
  });

  it('"up to 1": choosing none restricts nothing', () => {
    const g = played();
    none(g);
    g.act({ type: 'endTurn' });
    expect(can(g, V.c6)).toBe(true);
  });

  it('[On K.O.] has the same effect', () => {
    const g = start({ leader: OTHER_LEADER, characters: [ID] }, { characters: [V.c6, V.c7] });
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c6)]);
    g.act({ type: 'endTurn' });
    expect(can(g, V.c6)).toBe(false);
    expect(can(g, V.c7)).toBe(true);
  });

  it("[On K.O.] on your own turn: the lock lasts through the opponent's next turn (turn 2), not turn 4", () => {
    const g = start({ leader: OTHER_LEADER, characters: [ID] }, { characters: [V.c6, V.c7] });
    koByEffect(g, 'p1', ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    g.act({ type: 'endTurn' });
    expect(can(g, V.c6)).toBe(false);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(can(g, V.c6)).toBe(true);
  });

  it("[On K.O.] on the opponent's turn: the lock ends at that turn's End Phase (RL-11), not their next turn", () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { characters: [V.c6] });
    pick(g, [g.find('p2', 'characters', V.c6)]);
    while (g.decider === 'p1' && g.legal().some((a) => a.type === 'endCounter')) {
      g.act({ type: 'endCounter' });
    }
    expect(can(g, V.c6)).toBe(false); // the rest of this turn
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' }); // p1's turn
    expect(can(g, V.c6)).toBe(true); // p2's next turn
  });
});

describeTbpTrigger(ID);

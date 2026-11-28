/** OP18-018 Let's Go, Karoo!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { AA1, ALA2, ANIMAL2, mk, trigGame } from './helpers-op18-g1.ts';

const ID = 'OP18-018';

describe("OP18-018 Let's Go, Karoo!!", () => {
  it('[Main] all of your {Alabasta} Characters gain +1000 power this turn', () => {
    const g = mk({ hand: [ID], characters: [ALA2, AA1, ANIMAL2] });
    play(g, ID);
    expect(g.power(g.find('p1', 'characters', ALA2))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', AA1))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', ANIMAL2))).toBe(4000); // not {Alabasta}
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[Main] does not touch the opponent's {Alabasta} Characters, and lasts only this turn", () => {
    const g = mk({ hand: [ID], characters: [ALA2] }, { characters: [AA1] });
    play(g, ID);
    expect(g.power(g.find('p2', 'characters', AA1))).toBe(3000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ALA2))).toBe(4000);
  });

  it('[Main] with no {Alabasta} Character it still resolves', () => {
    const g = mk({ hand: [ID], characters: [ANIMAL2] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p1', 'characters', ANIMAL2))).toBe(4000);
  });

  it('[Trigger] up to 1 Leader or Character gains +2000 power this turn', () => {
    const g = trigGame(ID, { characters: [ANIMAL2] });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ANIMAL2))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('[Trigger] may choose nothing', () => {
    const g = trigGame(ID, { characters: [ANIMAL2] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', ANIMAL2))).toBe(4000);
  });
});

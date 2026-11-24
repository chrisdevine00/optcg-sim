/** EB03-050 Conis. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, mk, SKY3, SKY6 } from './helpers-eb03g2.ts';

const ID = 'EB03-050';

describe('EB03-050 Conis', () => {
  it('[On Play]: up to 1 of your {Sky Island} Characters gains [Double Attack] during this turn', () => {
    const g = mk({ hand: [ID], characters: [SKY3, SKY6, V.c3] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', SKY3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', SKY6))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false); // not {Sky Island}
    pick(g, [g.find('p1', 'characters', SKY6)]);
    expect(g.card(g.find('p1', 'characters', SKY6)).keywords).toContain('Double Attack');
    expect(g.card(g.find('p1', 'characters', SKY3)).keywords).not.toContain('Double Attack');
  });

  it('Conis herself ({Sky Island}) is a legal target', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Double Attack');
  });

  it("only your Characters: the opponent's {Sky Island} Characters are not offered", () => {
    const g = mk({ hand: [ID] }, { characters: [SKY3] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', SKY3))).toBe(false);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ hand: [ID], characters: [SKY3] });
    play(g, ID);
    none(g);
    expect(g.card(g.find('p1', 'characters', SKY3)).keywords).not.toContain('Double Attack');
    expectDecision(g, 'main', 'p1');
  });

  it('lasts this turn only', () => {
    const g = mk({ hand: [ID], characters: [SKY3] });
    play(g, ID);
    pick(g, [g.find('p1', 'characters', SKY3)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', SKY3)).keywords).not.toContain('Double Attack');
  });
});

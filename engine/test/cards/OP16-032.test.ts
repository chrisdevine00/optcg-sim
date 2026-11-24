/** OP16-032 Boa Hancock. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { LUFFY_034, mine } from './helpers-op16g2.ts';

const ID = 'OP16-032';

describe('OP16-032 Boa Hancock', () => {
  const start = (opp: string[]) => mine({ hand: [ID] }, { characters: opp });
  const canAttack = (g: ReturnType<typeof start>, card: string) =>
    g.isLegal({
      type: 'attack',
      attacker: g.find('p2', 'characters', card),
      target: g.leader('p1'),
      player: 'p2',
    });

  it('has [Unblockable]', () => {
    const g = start([]);
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Unblockable');
  });

  it("[On Play] up to 1 opposing Character cannot be rested until the end of the opponent's next End Phase", () => {
    const g = start([V.c3, V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expectDecision(g, 'main', 'p1');
    g.act({ type: 'endTurn' });
    expect(canAttack(g, V.c5)).toBe(false); // an attack rests the attacker, so it cannot attack
    expect(canAttack(g, V.c3)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canAttack(g, V.c5)).toBe(true); // over after the opponent's End Phase
  });

  it('a [Monkey.D.Luffy] is not a candidate', () => {
    const g = start([LUFFY_034, V.c3]);
    play(g, ID);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).toEqual([
      g.find('p2', 'characters', V.c3),
    ]);
  });

  it('"up to 1": it may choose none (no restriction), and only one is restricted', () => {
    const g = start([V.c3, V.c5]);
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    expect(canAttack(g, V.c5)).toBe(true);
    expect(canAttack(g, V.c3)).toBe(true);
  });

  it('with only a [Monkey.D.Luffy] on the opposing side nothing can be chosen', () => {
    const g = start([LUFFY_034]);
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // nothing to choose: nothing is asked
    g.act({ type: 'endTurn' });
    expect(canAttack(g, LUFFY_034)).toBe(true);
  });
});

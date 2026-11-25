/** EB02-018 Buggy. */
import { describe, expect, it } from 'vitest';
import { C1, C4, canPick, expectDecision, mk, pick, V } from './helpers-aeb2g1.ts';
import { play } from './helpers.ts';
import { trigGame } from './helpers-op11g1.ts';

const ID = 'EB02-018';
const OTHER_BUGGY = 'OP03-008'; // a [Buggy] Character of another card number
const start = (chars: string[] = [], p2chars: string[] = []) =>
  mk(
    { hand: [ID], characters: chars, costArea: { active: 5, rested: 0 } },
    { characters: p2chars },
  );
const doubleAttack = (g: ReturnType<typeof start>): boolean =>
  g.card(g.leader('p1')).keywords.includes('Double Attack');

describe('EB02-018 Buggy', () => {
  it('[On Play] with no other [Buggy] Character: the Leader gains [Double Attack] this turn only', () => {
    const g = start([C1]);
    play(g, ID);
    expect(doubleAttack(g)).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(doubleAttack(g)).toBe(false);
  });

  it('another [Buggy] Character on your field (any card number) stops it', () => {
    const g = start([OTHER_BUGGY]);
    play(g, ID);
    expect(doubleAttack(g)).toBe(false);
    expectDecision(g, 'main', 'p1');
  });

  it("a [Buggy] in your hand or on the opponent's field does not count", () => {
    const g = mk(
      { hand: [ID, OTHER_BUGGY], costArea: { active: 5, rested: 0 } },
      { characters: [OTHER_BUGGY] },
    );
    play(g, ID);
    expect(doubleAttack(g)).toBe(true);
  });

  it('the Leader is not asked about (no pick): it just gains the keyword', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(doubleAttack(g)).toBe(true);
  });

  it("[Trigger]: rests up to 1 of the opponent's Characters with cost 4 or less (cost 5 not offered)", () => {
    const g = trigGame(ID, {}, [C4, V.c5]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', C4))).toBe(true);
    pick(g, [g.find('p2', 'characters', C4)]);
    expect(g.card(g.find('p2', 'characters', C4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });
});

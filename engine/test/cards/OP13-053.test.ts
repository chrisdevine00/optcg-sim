/** OP13-053 Marshall.D.Teach. */
import { describe, expect, it } from 'vitest';
import { accept, decline, hand, pick, trash } from './helpers.ts';
import { canPick, cardsOf, expectDecision, mk, V, WB4, WB_ALLY } from './helpers-op13g2.ts';

const ID = 'OP13-053';

const attack = (chars: string[] = [WB4, V.c2]) => {
  const g = mk({ characters: [ID, ...chars], hand: [V.c1] });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};
const keywords = (g: ReturnType<typeof attack>) => g.card(g.find('p1', 'characters', ID)).keywords;

describe('OP13-053 Marshall.D.Teach', () => {
  it('[When Attacking]: trash a {Whitebeard Pirates} Character to draw 1 and gain [Banish] this turn', () => {
    const g = attack();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'characters', WB4)]);
    expect(trash(g, 'p1')).toEqual([WB4]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(keywords(g)).toContain('Banish');
  });

  it('the cost can be paid with Teach himself (he has the type); only types including the text qualify', () => {
    const g = attack([V.c2, WB_ALLY]);
    accept(g);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', WB_ALLY))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'characters', WB_ALLY)]);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([WB_ALLY]);
  });

  it('declining the cost draws nothing and grants no [Banish]', () => {
    const g = attack();
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(keywords(g)).not.toContain('Banish');
    expect(cardsOf(g, 'p1', 'characters')).toContain(WB4);
  });

  it('with no other {Whitebeard Pirates} Character Teach can still trash himself and draw', () => {
    const g = attack([V.c2]);
    accept(g); // Teach is the only candidate: the cost is paid without a choice
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('[Banish] ends with the turn', () => {
    const g = attack();
    accept(g);
    pick(g, [g.find('p1', 'characters', WB4)]);
    expect(keywords(g)).toContain('Banish');
    // Finish the battle and the turn; Teach's grant is "during this turn".
    g.act({ type: 'block', blocker: null, player: 'p2' });
    g.act({ type: 'endCounter' });
    for (let i = 0; i < 3 && g.legal().some((a) => a.type === 'trigger'); i++)
      g.act({ type: 'trigger', activate: false });
    g.act({ type: 'endTurn' });
    expect(keywords(g)).not.toContain('Banish');
  });
});

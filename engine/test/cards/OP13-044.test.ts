/** OP13-044 Curiel. */
import { describe, expect, it } from 'vitest';
import { hand, pick } from './helpers.ts';
import { canPick, expectDecision, koBy, mk, V, WB4, WB_LEADER } from './helpers-op13g2.ts';

const ID = 'OP13-044';

const attack = (leader: string, chars: string[] = [WB4, V.c2], rested = 2) => {
  const g = mk({ leader, characters: [ID, ...chars], costArea: { active: 0, rested } });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP13-044 Curiel', () => {
  it('[When Attacking]: gives up to 1 rested DON!! to a {Whitebeard Pirates} Leader', () => {
    const g = attack(WB_LEADER);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('or to 1 Character with a type including "Whitebeard Pirates"', () => {
    const g = attack(WB_LEADER);
    expect(canPick(g, g.find('p1', 'characters', WB4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true); // Curiel is one himself
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'characters', WB4)]);
    expect(g.card(g.find('p1', 'characters', WB4)).don).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('must not offer a Leader whose type is not {Whitebeard Pirates}', () => {
    const g = attack('ST03-001');
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', WB4))).toBe(true);
  });

  it('"up to 1": none may be given, and with no rested DON!! nothing is asked', () => {
    const g = attack(WB_LEADER);
    g.act({ type: 'done' });
    expect(g.card(g.leader('p1')).don).toBe(0);
    const h = attack(WB_LEADER, [WB4], 0);
    expect(h.card(h.leader('p1')).don).toBe(0);
    expectDecision(h, 'block', 'p2');
  });

  it('[On K.O.]: draws 1 card', () => {
    const g = mk({ characters: [ID], hand: [V.c1] });
    koBy(g, 'p1', ID, 'p2');
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});

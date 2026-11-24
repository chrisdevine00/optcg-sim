/** ST29-002 Usopp. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, PURPLE, V } from './helpers.ts';
import { attackLeader, canPick, finishBattle, lifeOf, mk } from './helpers-st29old.ts';

const ID = 'ST29-002';
const opp = (life: number, chars: string[]) => ({
  characters: chars,
  life: Array.from({ length: life }, () => PURPLE),
});

describe('ST29-002 Usopp', () => {
  it("[On Play]: rests up to 1 opposing Character with a cost of at most the opponent's Life", () => {
    const g = mk({ hand: [ID] }, opp(3, [V.c3, V.c4, V.c2]));
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // 3 = 3 life
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('boundary: with 2 Life the cost 3 Character is no longer a target; with 4 the cost 4 is', () => {
    const g = mk({ hand: [ID] }, opp(2, [V.c3, V.c2]));
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    const h = mk({ hand: [ID] }, opp(4, [V.c4, V.c5]));
    play(h, ID);
    expect(canPick(h, h.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(h, h.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('[When Attacking]: the same rest, and "up to 1" may rest nothing', () => {
    const g = mk({ characters: [ID], life: lifeOf(3) }, opp(3, [V.c3]));
    attackLeader(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    finishBattle(g);
    const h = mk({ characters: [ID] }, opp(3, [V.c3]));
    attackLeader(h, h.find('p1', 'characters', ID));
    none(h);
    expect(h.card(h.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('must not target the Leader (Characters only) nor reach past the Life bound', () => {
    const g = mk({ hand: [ID] }, opp(3, [V.c4]));
    play(g, ID);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
  });

  it('an opponent with 0 Life has no legal target (every cost is above 0 except none here)', () => {
    const g = mk({ hand: [ID] }, opp(0, [V.c1]));
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(false);
  });
});

/** OP14-013 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle, LUFFY_SN, mk, RED0, SN2, SN5 } from './helpers-op14g1.ts';

const ID = 'OP14-013';

// Top 5: two {Supernovas} (a Character and one named [Monkey.D.Luffy]), a non-{Supernovas}, and 2 more.
const top5 = [SN5, LUFFY_SN, RED0, SN2, V.c1];

describe('OP14-013 Monkey.D.Luffy', () => {
  const onPlay = () => {
    const g = mk({ hand: [ID], deck: [...top5, ...times(5, BLUE)] });
    play(g, ID);
    return g;
  };

  it('[On Play]: reveals up to 1 {Supernovas} card other than [Monkey.D.Luffy] into your hand; the rest go to the bottom', () => {
    const g = onPlay();
    pick(g, [g.find('p1', 'deck', SN5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SN5]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(9);
    expect(deck.slice(5).sort()).toEqual([LUFFY_SN, RED0, SN2, V.c1].sort());
  });

  it('candidates: {Supernovas} only, [Monkey.D.Luffy] excluded', () => {
    const g = onPlay();
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', SN5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SN2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', LUFFY_SN))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', RED0))).toBe(false);
  });

  it('boundary: the 6th card is not looked at; "up to 1" may take nothing', () => {
    const g = mk({ hand: [ID], deck: [RED0, V.c1, V.c2, V.c3, V.c4, SN5, ...times(4, BLUE)] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    const h = onPlay();
    none(h);
    finishOrder(h);
    expect(hand(h, 'p1')).toEqual([]);
  });

  it("[When Attacking]: -1000 to up to 1 of the opponent's Characters this turn", () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] });
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(4000);
    finishBattle(g);
  });

  it('[When Attacking] "up to 1": may choose nothing; the power is 0 so it is still a legal attacker', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] });
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });
});

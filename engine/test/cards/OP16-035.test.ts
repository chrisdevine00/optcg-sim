/** OP16-035 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, hand, option, pick, play, V } from './helpers.ts';
import { pickDon } from './helpers-rgl-penel.ts';
import { mine } from './helpers-op16g2.ts';

const ID = 'OP16-035';

describe('OP16-035 Roronoa Zoro', () => {
  const start = (hand_: string[] = [ID, V.c1]) =>
    mine({ hand: hand_ }, { characters: [V.c3], costArea: { active: 2, rested: 0 } });

  it("[On Play] rests up to 1 of your opponent's cards; trashing 1 card gives up to 3 rested DON!! to your Leader", () => {
    const g = start();
    play(g, ID);
    const target = g.find('p2', 'characters', V.c3);
    pick(g, [target]);
    expect(g.card(target).rested).toBe(true);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    option(g, '3');
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(V.c1);
  });

  it('"cards" includes the opponent\'s DON!!: an active DON!! can be rested', () => {
    const g = start();
    play(g, ID);
    pickDon(g, 'active', 1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1 });
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('declining the trash gives no DON!!', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    decline(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('"up to 3": a smaller count may be chosen', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    option(g, '1');
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('with no card in hand to trash the DON!! is not given ("If you do")', () => {
    const g = start([ID]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
  });
});

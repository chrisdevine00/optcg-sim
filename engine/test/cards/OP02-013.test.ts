/** OP02-013 Portgas.D.Ace (Character). */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { NAVY_LEADER, offers, WB_LEADER } from './helpers-stg2.ts';

const ID = 'OP02-013';
const start = (leader: string, opp: string[]) =>
  game(
    { leader, hand: [ID], costArea: { active: 7, rested: 0 } },
    { leader: PLAIN_BLUE, characters: opp },
  );

describe('OP02-013 Portgas.D.Ace', () => {
  it('[On Play] gives up to 2 opposing Characters -3000 power this turn (exact amount)', () => {
    const g = start(WB_LEADER, [V.c4, V.c3, V.c1]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(2000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000); // not chosen
    expectDecision(g, 'main', 'p1');
  });

  it('with a {Whitebeard Pirates} Leader this Character gains [Rush] this turn only and can attack at once', () => {
    const g = start(WB_LEADER, [V.c4]);
    play(g, ID);
    g.act({ type: 'done' });
    const ace = g.find('p1', 'characters', ID);
    expect(g.card(ace).keywords).toContain('Rush');
    expect(g.isLegal({ type: 'attack', attacker: ace, target: g.leader('p2'), player: 'p1' })).toBe(
      true,
    );
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(ace).keywords).not.toContain('Rush');
  });

  it('with a Leader whose type does not include "Whitebeard Pirates" there is no [Rush] and no attack', () => {
    const g = start(NAVY_LEADER, [V.c4]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    const ace = g.find('p1', 'characters', ID);
    expect(g.card(ace).keywords).not.toContain('Rush');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
    expect(g.isLegal({ type: 'attack', attacker: ace, target: g.leader('p2'), player: 'p1' })).toBe(
      false,
    );
  });

  it('"Then, if": Rush is granted even when no opposing Character is chosen or there is none', () => {
    const g = start(WB_LEADER, []);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('only opposing Characters are candidates, at most 2 may be chosen', () => {
    const g = start(WB_LEADER, [V.c4, V.c3, V.c1]);
    play(g, ID);
    expect(offers(g)).toHaveLength(3);
    pick(g, [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(7000);
  });
});

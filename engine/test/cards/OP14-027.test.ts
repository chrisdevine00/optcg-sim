/** OP14-027 Shanks. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, boost, finishBattle, mk, restedCard } from './helpers-op14g1.ts';

const ID = 'OP14-027';

describe('OP14-027 Shanks', () => {
  const start = () => mk({ characters: [ID] }, { characters: [V.c3, V.c5, V.c6, V.c1] });

  it('[Your Turn] when rested (attacking): rests up to 1 opposing Character with 7000 base power or less', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
    finishBattle(g);
  });

  it('boundary: 7000 base is a candidate, 8000 is not; the power read is BASE (a boosted 5000 Character stays eligible)', () => {
    const g = start();
    boost(g, g.find('p2', 'characters', V.c3), 4000);
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // base 5000, now 9000
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start();
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it("[Opponent's Turn] rested: all the opponent's Characters get -1000 power (not the Leader)", () => {
    const g = mk(
      { characters: [restedCard(ID)] },
      { characters: [V.c3, V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('must not apply while active, nor on your own turn, nor does the rest trigger on their turn', () => {
    const active = mk(
      { characters: [ID] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(active.power(active.find('p2', 'characters', V.c3))).toBe(5000);
    const own = mk({ characters: [restedCard(ID)] }, { characters: [V.c3] });
    expect(own.power(own.find('p2', 'characters', V.c3))).toBe(5000);

    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    plantOpponentEffect(g, { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).toBe('main'); // no [Your Turn] prompt on their turn
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });
});

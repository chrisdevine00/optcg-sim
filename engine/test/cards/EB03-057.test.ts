/** EB03-057 Yamato (cost 5). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  game,
  option,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { koBy } from './helpers-w3s.ts';
import { finishBattle, mk, WANO_LEADER } from './helpers-w4sb.ts';

const ID = 'EB03-057';
const play = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

/** p2 attacks p1's rested Yamato with a 9000 Character and wins the battle: [On K.O.] is next. */
function koed(lifeP2 = [V.c4, V.c5, V.c6]) {
  const g = game(
    { leader: WANO_LEADER, characters: [{ card: ID, rested: true }] },
    { leader: PLAIN_BLUE, characters: [V.c7], life: lifeP2 },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', ID),
  });
  finishBattle(g);
  return g;
}

describe('EB03-057 Yamato', () => {
  it('[On Play]: gives up to 3 rested DON!! to your {Land of Wano} Leader', () => {
    const g = mk({ hand: [ID], leader: WANO_LEADER, costArea: { active: 8, rested: 0 } });
    play(g); // pays 5: 3 active, 5 rested
    expectDecision(g, 'choose', 'p1');
    option(g, '3');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('"up to 3": 2 can be given, and "None" gives nothing; active DON!! are never given', () => {
    const g = mk({ hand: [ID], leader: WANO_LEADER, costArea: { active: 8, rested: 0 } });
    play(g);
    option(g, '2');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 3 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    const h = mk({ hand: [ID], leader: WANO_LEADER, costArea: { active: 8, rested: 0 } });
    play(h);
    option(h, '0');
    expect(h.power(h.leader('p1'))).toBe(5000);
    expect(don(h, 'p1')).toMatchObject({ active: 3, rested: 5 });
  });

  it('must not give to a Leader of another type: nothing is asked', () => {
    const g = mk({ hand: [ID], leader: PLAIN_BLUE, costArea: { active: 8, rested: 0 } });
    play(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 5 });
  });

  it("[On K.O.]: trashes up to 1 of your opponent's top Life cards (no [Trigger])", () => {
    const g = koed();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(g.life('p2')).toBe(2);
    expect(trash(g, 'p2')).toEqual([V.c4]);
    expect(dec(g)?.kind).not.toBe('trigger');
  });

  it('"up to 1": may be declined, and with no opposing Life nothing happens', () => {
    const g = koed();
    decline(g);
    expect(g.life('p2')).toBe(3);
    const h = koed([]);
    expect(trash(h, 'p2')).toEqual([]);
    expect(h.life('p2')).toBe(0);
  });

  it('fires on your own turn as well (no turn condition)', () => {
    const g = game(
      { leader: WANO_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, life: [V.c4, V.c5, V.c6] },
    );
    koBy(g, 'p1', ID, 'p1');
    accept(g);
    expect(g.life('p2')).toBe(2);
  });
});

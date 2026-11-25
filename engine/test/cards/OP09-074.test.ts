/** OP09-074 Bepo. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, game, none, payDon, pick, PLAIN_BLUE, V } from './helpers.ts';
import { canPick, plant } from './helpers-a09g2.ts';

const ID = 'OP09-074';
const LEADER = 'ST01-001';
const RETURN1 = { returnDon: { n: 1 } };
const start = () =>
  game(
    { leader: LEADER, characters: [ID, V.c3], costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE, costArea: { active: 5, rested: 0 } },
  );

describe('OP09-074 Bepo', () => {
  it('[Your Turn] [Once Per Turn]: when your DON!! is returned, a Character gains +1000 power this turn', () => {
    const g = start();
    plant(g, 'p1', RETURN1);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(6000); // 5000 + 1000
    expect(g.power(g.find('p1', 'characters', ID))).toBe(2000);
  });

  it('the Leader or Bepo himself can be chosen', () => {
    const g = start();
    plant(g, 'p1', RETURN1);
    payDon(g);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('once per turn: a second return gives nothing', () => {
    const g = start();
    plant(g, 'p1', RETURN1);
    payDon(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    plant(g, 'p1', RETURN1);
    payDon(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(6000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = start();
    plant(g, 'p1', RETURN1);
    payDon(g);
    none(g);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("on the opponent's turn nothing happens (a [Your Turn] effect)", () => {
    const g = game(
      { leader: LEADER, characters: [ID, V.c3], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: 5, rested: 0 } },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', { returnDon: { n: 1, player: 'opponent' } });
    payDon(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it("the opponent's DON!! returning does not trigger it on your turn", () => {
    const g = start();
    plant(g, 'p1', { returnDon: { n: 1, player: 'opponent' } });
    payDon(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });
});

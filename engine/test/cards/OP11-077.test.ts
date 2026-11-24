/** OP11-077 Randolph. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, game, none, payDon, pick, PLAIN_BLUE, V } from './helpers.ts';
import { BMP5, canPick, plant } from './helpers-op11g3.ts';

const ID = 'OP11-077';
const RETURN_MINE = { returnDon: { n: 1 } };

describe('OP11-077 Randolph', () => {
  const start = (characters: string[] = [ID, BMP5, V.c3]) =>
    game(
      { leader: 'ST01-001', characters, costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[Your Turn] [Once Per Turn]: when your DON!! is returned, up to 1 "Big Mom Pirates" Character gains +2 cost', () => {
    const g = start();
    plant(g, 'p1', RETURN_MINE);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', BMP5))).toBe(true);
    pick(g, [g.find('p1', 'characters', BMP5)]);
    expect(g.card(g.find('p1', 'characters', BMP5)).cost).toBe(7);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(1);
  });

  it('Randolph is a "Big Mom Pirates" Character too and can raise himself', () => {
    const g = start();
    plant(g, 'p1', RETURN_MINE);
    payDon(g);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(3);
  });

  it("lasts until the end of your opponent's next turn, then ends", () => {
    const g = start();
    plant(g, 'p1', RETURN_MINE);
    payDon(g);
    pick(g, [g.find('p1', 'characters', BMP5)]);
    g.act({ type: 'endTurn' });
    // The opponent's turn: still +2.
    expect(g.card(g.find('p1', 'characters', BMP5)).cost).toBe(7);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', BMP5)).cost).toBe(5);
  });

  it('only once per turn: a second return does not trigger', () => {
    const g = start();
    plant(g, 'p1', RETURN_MINE);
    payDon(g);
    pick(g, [g.find('p1', 'characters', BMP5)]);
    plant(g, 'p1', RETURN_MINE);
    payDon(g);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.card(g.find('p1', 'characters', BMP5)).cost).toBe(7);
  });

  it('"up to 1": may choose nothing', () => {
    const g = start();
    plant(g, 'p1', RETURN_MINE);
    payDon(g);
    none(g);
    expect(g.card(g.find('p1', 'characters', BMP5)).cost).toBe(5);
  });

  it("does not fire on your opponent's turn", () => {
    const g = game(
      { leader: 'ST01-001', characters: [ID, BMP5], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plant(g, 'p2', { returnDon: { n: 1, player: 'opponent' } });
    payDon(g);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.card(g.find('p1', 'characters', BMP5)).cost).toBe(5);
  });

  it('does not fire when the opponent returns their own DON!!', () => {
    const g = game(
      { leader: 'ST01-001', characters: [ID, BMP5], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: 3, rested: 0 } },
    );
    plant(g, 'p1', { returnDon: { n: 1, player: 'opponent' } });
    payDon(g);
    expect(g.card(g.find('p1', 'characters', BMP5)).cost).toBe(5);
    expect(dec(g)?.kind).not.toBe('choose');
  });
});

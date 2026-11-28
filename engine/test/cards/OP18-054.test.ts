/** OP18-054 Mr.8 & Ms. Monday. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, game, hand, pick, trash } from './helpers.ts';
import {
  BW2,
  ids,
  OPP,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  plantOpponentEffect,
  V,
} from './helpers-op18-g2.ts';

const ID = 'OP18-054';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const KO2 = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 2 } } };
const start = (chars: string[], h: string[] = [V.c1]) =>
  game({ leader: PLAIN_PURPLE, characters: chars, hand: h }, { leader: PLAIN_BLUE }, OPP);

describe('OP18-054 Mr.8 & Ms. Monday', () => {
  it('[DON!! x1] gains +1000 power', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000); // 3000 + 1000 DON!! + 1000
  });

  it("[Opponent's Turn] a {Baroque Works} Character that would be K.O.'d by an effect stays if you trash 1 card", () => {
    const g = start([ID, BW2]);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', BW2)]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, BW2]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it("declining lets it be K.O.'d and keeps the hand", () => {
    const g = start([ID, BW2]);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', BW2)]);
    decline(g);
    expect(ids(g, 'p1', 'trash')).toEqual([BW2]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('covers Mr.8 himself, but not a Character of another type', () => {
    const g = start([ID]);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', ID)]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);

    const o = start([ID, V.c3]);
    plantOpponentEffect(o, KO);
    pick(o, [o.find('p1', 'characters', V.c3)]);
    expect(ids(o, 'p1', 'trash')).toEqual([V.c3]);
  });

  it('[Once Per Turn]: a second K.O. effect the same turn is not covered', () => {
    const g = start([ID, BW2, BW2], [V.c1, V.c2]);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', BW2, 0)]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, BW2, BW2]);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', BW2, 0)]);
    expect(ids(g, 'p1', 'trash')).toEqual([BW2, V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('one effect that K.O.s two of them is one event: the one replacement keeps both (QA-OP15 OP15-069 rule)', () => {
    const g = start([ID, BW2, BW2], [V.c1, V.c2]);
    plantOpponentEffect(g, KO2);
    pick(g, [g.find('p1', 'characters', BW2, 0), g.find('p1', 'characters', BW2, 1)]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, BW2, BW2]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it("an empty hand cannot pay: the Character is K.O.'d", () => {
    const e = start([ID, BW2], []);
    plantOpponentEffect(e, KO);
    pick(e, [e.find('p1', 'characters', BW2)]);
    // A cost paid from a hidden zone is offered, but cannot be accepted with nothing to pay it.
    expectDecision(e, 'optional', 'p1');
    expect(e.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(e);
    expect(ids(e, 'p1', 'trash')).toEqual([BW2]);
  });
});

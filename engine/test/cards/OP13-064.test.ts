/** OP13-064 Gol.D.Roger (Character, cost 10, 13000). */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  accept,
  BLUE,
  dec,
  decline,
  don,
  expectDecision,
  game,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  play,
  V,
} from './helpers.ts';
import { FORMER_ROGER, FORMER_ROGER_LEADER, ROGER_LEADER } from './helpers-w7c2.ts';

const ID = 'OP13-064';

describe('OP13-064 Gol.D.Roger: effects of your Leader and non-Roger Pirates Characters are negated', () => {
  const mk = (leader = PLAIN_PURPLE, mine: string[] = [ID, BLUE, FORMER_ROGER]) =>
    game({ leader, characters: mine }, { leader: PLAIN_BLUE, characters: [V.c3] });

  it('your Leader and a Character without a type including "Roger Pirates" are negated', () => {
    const g = mk();
    expect(g.card(g.leader('p1')).negated).toBe(true);
    expect(g.card(g.find('p1', 'characters', BLUE)).negated).toBe(true);
  });

  it('a type that only includes "Roger Pirates" is not negated (a substring match)', () => {
    const g = mk();
    expect(g.card(g.find('p1', 'characters', FORMER_ROGER)).negated).toBeFalsy();
    const h = mk(FORMER_ROGER_LEADER);
    expect(h.card(h.leader('p1')).negated).toBeFalsy();
  });

  it('a {Roger Pirates} Leader is not negated, and Roger never negates himself', () => {
    const g = mk(ROGER_LEADER);
    expect(g.card(g.leader('p1')).negated).toBeFalsy();
    expect(g.card(g.find('p1', 'characters', ID)).negated).toBeFalsy();
    expect(g.card(g.find('p1', 'characters', BLUE)).negated).toBe(true);
  });

  it("your opponent's cards are not negated", () => {
    const g = mk();
    expect(g.card(g.leader('p2')).negated).toBeFalsy();
    expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBeFalsy();
  });

  it('without Roger on the field nothing is negated', () => {
    const g = mk(PLAIN_PURPLE, [BLUE]);
    expect(g.card(g.leader('p1')).negated).toBeFalsy();
    expect(g.card(g.find('p1', 'characters', BLUE)).negated).toBeFalsy();
  });

  it('when Roger leaves the field the negation ends', () => {
    const g = mk();
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expect(g.card(g.leader('p1')).negated).toBeFalsy();
    expect(g.card(g.find('p1', 'characters', BLUE)).negated).toBeFalsy();
  });
});

describe('OP13-064 Gol.D.Roger [On Play] DON!! -3', () => {
  /** Roger in hand, 10 active DON!! (the cost), a Leader and the opponent's two Characters. */
  const start = () =>
    game(
      { leader: ROGER_LEADER, hand: [ID], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c5, V.c2] },
    );

  it('the Leader gains +2000 and every opposing Character -2000 (to the end of the next End Phase)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(2000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(13000);
  });

  it('declining the DON!! cost changes nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 10 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('with no opposing Characters the Leader still gains the power', () => {
    const g = game(
      { leader: ROGER_LEADER, hand: [ID], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    accept(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(dec(g)?.kind).toBe('main');
  });

  it('a Leader negated by Roger is still given the power by his own On Play', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    accept(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
    void expectDecision;
  });
});

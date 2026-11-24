/** OP11-110 Fukaboshi. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  game,
  hand,
  none,
  option,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { canPick, FMI_STAGE, idsOf, koedInBattle, koNow, SHIRAHOSHI } from './helpers-op11g3.ts';

const ID = 'OP11-110';

describe('OP11-110 Fukaboshi: [On Play]', () => {
  const start = (life: string[] = [BLUE, PURPLE, V.c3]) =>
    game(
      { leader: PLAIN_BLUE, hand: [ID], life, costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1, V.c2] },
    );

  it('[On Play]: add 1 card from the top of your Life cards to your hand: K.O. up to 1 opposing Character with cost 1 or less', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.life('p1')).toBe(2);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // cost 2
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it('or from the bottom of your Life cards', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([V.c3]);
    expect(idsOf(g, 'p1', 'life')).toEqual([BLUE, PURPLE]);
  });

  it('the cost is optional: declining keeps the Life and K.O.s nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1": the K.O. may be declined after the Life is taken', () => {
    const g = start();
    play(g, ID);
    accept(g);
    option(g, 'top');
    none(g);
    expect(g.life('p1')).toBe(2);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = start([]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });
});

describe('OP11-110 Fukaboshi: K.O. replacement', () => {
  const start = (leader: string, stage?: string, rested = false) =>
    game(
      {
        leader: rested ? { card: leader, rested: true } : leader,
        characters: [ID],
        ...(stage ? { stage } : {}),
      },
      { leader: PLAIN_BLUE },
    );

  it("if this Character would be K.O.'d, you may rest your [Shirahoshi] Leader instead", () => {
    const g = start(SHIRAHOSHI);
    koNow(g, 'p1', ID, 'p2');
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
  });

  it('or an active [Fish-Man Island] Stage; with both available you choose', () => {
    const g = start(SHIRAHOSHI, FMI_STAGE);
    koNow(g, 'p1', ID, 'p2');
    accept(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'stage', FMI_STAGE)]);
    expect(g.card(g.find('p1', 'stage', FMI_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('declining the replacement lets the K.O. happen', () => {
    const g = start(SHIRAHOSHI);
    koNow(g, 'p1', ID, 'p2');
    decline(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('with neither a [Shirahoshi] Leader nor a [Fish-Man Island] Stage there is no replacement', () => {
    const g = start(PLAIN_BLUE);
    koNow(g, 'p1', ID, 'p2');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('a rested [Shirahoshi] Leader cannot be rested again: no replacement', () => {
    const g = start(SHIRAHOSHI, undefined, true);
    koNow(g, 'p1', ID, 'p2');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('works for a battle K.O. too', () => {
    const g = koedInBattle(ID, { leader: SHIRAHOSHI });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });
});

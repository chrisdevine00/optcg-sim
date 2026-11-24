/** OP15-109 Nico Robin (Yellow). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  play,
  PURPLE,
  V,
} from './helpers.ts';
import {
  canAccept,
  donArea,
  mine,
  names,
  offers,
  OTHER_LEADER,
  SHC_C4,
  SHC_LEADER,
  SI_HOLLY,
  SI_SETO,
  SI_WYPER,
} from './helpers-op15g3.ts';

const ID = 'OP15-109';

describe('OP15-109 Nico Robin', () => {
  const start = (leader: string, handCards: string[], life = [PURPLE, V.c1, V.c2]) =>
    mine({ leader, hand: [ID, ...handCards], life, deck: [V.c4, V.c5, V.c6], ...donArea(7) });
  /** Answer the "add the top card of your deck to Life?" step. */
  const addToLife = (g: ReturnType<typeof start>) => {
    if (dec(g)?.kind === 'optional') accept(g);
  };

  it('[On Play] add the top Life card to your hand: with a {Straw Hat Crew} Leader add the top deck card to Life, then play a {Sky Island} Character with cost 5 or less from hand', () => {
    const g = start(SHC_LEADER, [SI_SETO]);
    play(g, ID);
    accept(g);
    expect(hand(g, 'p1')).toEqual([SI_SETO, PURPLE]);
    addToLife(g);
    expect(g.life('p1')).toBe(3); // 3 - 1 + 1
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c4); // the deck's top card is now the top Life card
    pick(g, [g.find('p1', 'hand', SI_SETO)]);
    expect(names(g, 'p1', 'characters')).toEqual([ID, SI_SETO]);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('the play bound is cost 5: a cost 6 {Sky Island} Character and a non-{Sky Island} Character are not candidates', () => {
    const g = start(SHC_LEADER, [SI_WYPER, SHC_C4]);
    play(g, ID);
    accept(g);
    addToLife(g);
    expect(offers(g, g.find('p1', 'hand', SI_WYPER))).toBe(false);
    expect(offers(g, g.find('p1', 'hand', SHC_C4))).toBe(false);
    none(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('with a Leader that is not {Straw Hat Crew} the cost is paid and neither step happens ("Then" sits inside the "If")', () => {
    const g = start(OTHER_LEADER, [SI_HOLLY]);
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([SI_HOLLY, PURPLE]);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('declining the cost does nothing at all', () => {
    const g = start(SHC_LEADER, [SI_HOLLY]);
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([SI_HOLLY]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('the cost cannot be paid with no Life cards', () => {
    const g = start(SHC_LEADER, [SI_HOLLY], []);
    play(g, ID);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([SI_HOLLY]);
  });
});

/** OP18-038 Shoot Down That Flag. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, PLAIN_BLUE, play } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { PLAIN_PURPLE, SHC3, SHC4, W7 } from './helpers-op18.ts';

const ID = 'OP18-038';
/** EB02-024 Sogeking ({Sniper Island}, not {Straw Hat Crew}): scenery in the deck. */
const SOGEKING = 'EB02-024';
const main = (deck: string[]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], deck, costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP18-038 Shoot Down That Flag.', () => {
  it('[Main] looks at 5 and adds up to 1 {Straw Hat Crew} card; the rest go to the bottom', () => {
    const g = main([BLUE, W7, SHC3, BLUE, BLUE, SHC4]);
    play(g, ID);
    expect(candidates(g)).toEqual([g.find('p1', 'deck', SHC3)]);
    pick(g, [g.find('p1', 'deck', SHC3)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SHC3]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(SHC4); // the 6th card was not looked at
  });

  it('a card named [Sogeking] qualifies too', () => {
    const g = main([SOGEKING, BLUE, BLUE, BLUE, BLUE]);
    play(g, ID);
    expect(candidates(g)).toEqual([g.find('p1', 'deck', SOGEKING)]);
  });

  it('"up to 1": may add nothing', () => {
    const g = main([SHC3, BLUE, BLUE, BLUE, BLUE]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] draws 1 card', () => {
    const g = game(
      { leader: PLAIN_PURPLE, life: [ID], deck: [BLUE, BLUE] },
      { leader: PLAIN_BLUE, characters: ['OP01-092'] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', 'OP01-092'),
      target: g.leader('p1'),
    });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });
});

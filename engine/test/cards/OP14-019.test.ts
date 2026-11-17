/** OP14-019 I Have a Plan to Take Down One of the Four Emperors!! */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, play, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { damageWith } from './triggers.ts';
import {
  cardsOf,
  donArea,
  EGGHEAD,
  EVENTS,
  finishOrder,
  SHC,
  SHC_LEADER,
  SUPERNOVA,
} from './helpers-luffyace.ts';

const ID = 'OP14-019';

describe('OP14-019 I Have a Plan to Take Down One of the Four Emperors!!', () => {
  // Top 4: purple filler, a Straw Hat Crew Event (not a Character), a Supernovas Character, a
  // Straw Hat Crew Character. Fifth card: a Straw Hat Crew Character that is not looked at.
  const deck = [EVENTS[1], PURPLE, SUPERNOVA, SHC.jinbe2, SHC.zoro4, EGGHEAD];
  const start = () =>
    game({ leader: SHC_LEADER, hand: [ID], deck, ...donArea(1) }, { leader: PLAIN_BLUE });

  it('[Main]: look at 4; only a {Supernovas} or {Straw Hat Crew} Character card may be added', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered.sort()).toEqual(
      [g.find('p1', 'deck', SUPERNOVA), g.find('p1', 'deck', SHC.jinbe2)].sort(),
    );
    pick(g, [g.find('p1', 'deck', SUPERNOVA)]);
    expect(hand(g, 'p1')).toEqual([SUPERNOVA]);
    finishOrder(g);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(SHC.zoro4);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length - 1);
  });

  it('may add nothing (CR 8-4-4-2)', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length);
  });

  it('[Trigger]: draw 1 card', () => {
    const g = damageWith(ID, { deck: [SHC.jinbe2, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([SHC.jinbe2]);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });
});

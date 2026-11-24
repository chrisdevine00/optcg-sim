/** ST29-004 Sanji. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, PURPLE, times, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import {
  canPick,
  cardsIn,
  finishOrder,
  LUFFY_LEADER,
  mk,
  pickable,
  SHC,
} from './helpers-st29old.ts';

const ID = 'ST29-004';

describe('ST29-004 Sanji', () => {
  // Top 4: a non-{Straw Hat Crew}, two {Straw Hat Crew}; the fifth card is not looked at.
  const deck = [PURPLE, SHC.zoro4, SHC.nami5, BLUE, SHC.franky5, ...times(4, BLUE)];
  const start = () => mk({ hand: [ID], deck });

  it('[On Play]: look at 4; add up to 1 {Straw Hat Crew} card, the rest go to the bottom', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(pickable(g).sort()).toEqual(
      [g.find('p1', 'deck', SHC.zoro4), g.find('p1', 'deck', SHC.nami5)].sort(),
    );
    pick(g, [g.find('p1', 'deck', SHC.nami5)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SHC.nami5]);
    const d = cardsIn(g, 'p1', 'deck');
    expect(d).toHaveLength(8);
    expect(d[0]).toBe(SHC.franky5); // the fifth card is now on top
  });

  it('boundary: a {Straw Hat Crew} card in 5th place is not offered', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', SHC.franky5))).toBe(false);
  });

  it('may add nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(9);
  });

  it('[Trigger]: you may trash 1 card from your hand: play this card', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, hand: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger]: declining adds the card to the hand; with an empty hand the cost cannot be paid', () => {
    const g = damageGame(ID, { leader: LUFFY_LEADER, hand: [V.c1] });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1').sort()).toEqual([ID, V.c1].sort());
    const h = damageGame(ID, { leader: LUFFY_LEADER });
    expect(h.isLegal({ type: 'trigger', activate: true, player: 'p1' })).toBe(false);
  });
});

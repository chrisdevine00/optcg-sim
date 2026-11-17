/** OP17-106 Charlotte Smoothie: [Your Turn] [On Play] rest 2 DON!!: add 1 card to Life, then the opponent trashes 1; [Trigger] play this card. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { ENEL, ids, triggerHit } from './helpers-robin.ts';

const SMOOTHIE = 'OP17-106';

const onPlay = () =>
  game(
    {
      leader: ENEL,
      hand: [SMOOTHIE],
      deck: [PURPLE, BLUE, BLUE],
      costArea: { active: 7, rested: 0 },
    },
    { leader: PLAIN_BLUE, hand: [BLUE, PURPLE] },
  );

describe('OP17-106 Charlotte Smoothie', () => {
  it('[On Play] rest 2 DON!!: add the top card of the deck to Life, then the opponent trashes 1 card from hand', () => {
    const g = onPlay();
    play(g, SMOOTHIE);
    accept(g);
    payDon(g);
    accept(g); // add the top card to Life
    expect(ids(g, 'p1', 'life')[0]).toBe(PURPLE);
    expect(g.life('p1')).toBe(4);
    // The opponent chooses which card to trash.
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', PURPLE)]);
    expect(ids(g, 'p2', 'trash')).toEqual([PURPLE]);
    expect(hand(g, 'p2')).toEqual([BLUE]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
  });

  it('[On Play] "Then": the opponent still trashes if you decline to add the Life card', () => {
    const g = onPlay();
    play(g, SMOOTHIE);
    accept(g);
    payDon(g);
    decline(g);
    expect(g.life('p1')).toBe(3);
    pick(g, [g.find('p2', 'hand', BLUE)]);
    expect(hand(g, 'p2')).toEqual([PURPLE]);
  });

  it('[On Play] with the opponent hand empty nothing is trashed', () => {
    const g = game(
      { leader: ENEL, hand: [SMOOTHIE], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, SMOOTHIE);
    accept(g);
    payDon(g);
    accept(g);
    // M4b-05: the opponent's hand is empty (public), so no "trash 0 cards" decision is asked.
    expect(g.life('p1')).toBe(4);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play] the DON!! cost may be declined: nothing happens', () => {
    const g = onPlay();
    play(g, SMOOTHIE);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p2')).toEqual([BLUE, PURPLE]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 5 });
  });

  it('[Trigger] plays this card, but on the opponent turn the [Your Turn] [On Play] does not activate', () => {
    const g = triggerHit(SMOOTHIE, { costArea: { active: 3, rested: 0 } });
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([SMOOTHIE]);
    expectDecision(g, 'main', 'p2');
    expect(g.life('p1')).toBe(1); // one Life card left after the hit, none added
  });
});

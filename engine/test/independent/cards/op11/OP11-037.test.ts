/**
 * OP11-037 Ancient Weapon Poseidon (Green Event, cost 1, {Fish-Man Island}).
 *
 * Card text: "[Main] Look at 4 cards from the top of your deck; reveal up to 1 {Neptunian} or
 * {Fish-Man Island} type Character card and add it to your hand. Then, place the rest at the bottom
 * of your deck in any order. [Trigger] Draw 1 card."
 *
 * Rules: only Character cards qualify; a quoted type is matched as that exact type ({Fish-Man} is
 * not {Fish-Man Island}). The chosen card is revealed (CR 11-2-1). "Up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  C11,
  deck,
  describeLook,
  E11,
  fill,
  hand,
  L11,
  mine,
  need,
  noDefenceUntilTrigger,
  offeredIds,
  attack,
  playCard,
  theirs,
  trash,
} from './kit-op11b.ts';

const POSEIDON = 'OP11-037';

describeLook({
  id: 'OP11-037',
  n: 4,
  start: (deckTop) => {
    const g = mine(L11.mono, { hand: [POSEIDON], deck: deckTop });
    playCard(g, POSEIDON);
    return g;
  },
  match: [C11.nep6, C11.fmi5],
  miss: C11.merfolk1,
  notOffered: [
    { card: E11.poseidon37, why: 'an Event with the type {Fish-Man Island} is not a Character' },
    { card: C11.shc2, why: 'the type {Fish-Man} is not {Fish-Man Island}' },
  ],
  rest: 'bottom',
});

describe('OP11-037 Ancient Weapon Poseidon: cost and [Trigger]', () => {
  it('both qualifying types are offered together: a {Neptunian} and a {Fish-Man Island} Character, and another {Fish-Man Island}', () => {
    const g = mine(L11.mono, {
      hand: [POSEIDON],
      deck: [C11.nep6b, C11.fmi5b, C11.merfolk1, C11.c1, ...fill(BLUE, 12)],
    });
    playCard(g, POSEIDON);
    // {Merfolk}/{Fish-Man Island} Ryuboshi and {Neptunian} Bird Neptunian qualify; Camie does not.
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.nep6b, C11.fmi5b].sort());
  });

  it('the Event is paid for (1 DON!!) and ends in the trash, not in the hand', () => {
    const g = mine(L11.mono, {
      hand: [POSEIDON],
      deck: [C11.nep6, ...fill(BLUE, 14)],
    });
    playCard(g, POSEIDON);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([POSEIDON]);
    expect(deck(g)).toHaveLength(15);
  });

  it('[Trigger]: when revealed from Life it draws 1 card', () => {
    const g = theirs(L11.mono, {
      life: [POSEIDON, ...fill(BLUE, 3)],
      deck: [C11.c3, ...fill(BLUE, 14)],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    expect(hand(g)).toEqual([C11.c3]);
    expect(trash(g)).toEqual([POSEIDON]);
    expect(deck(g)).toHaveLength(14);
  });

  it('[Trigger]: declining it adds the Event to the hand and draws nothing', () => {
    const g = theirs(L11.mono, {
      life: [POSEIDON, ...fill(BLUE, 3)],
      deck: [C11.c3, ...fill(BLUE, 14)],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([POSEIDON]);
    expect(deck(g)).toHaveLength(15);
  });
});

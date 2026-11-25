/** EB02-022 Usopp. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import {
  AK,
  asks,
  boost,
  game,
  inert,
  OTHER_LEADER,
  pickableCards,
  TEN,
  TRIGGER_ONLY,
  WITH_ON_PLAY,
} from './helpers-w6c1.ts';

const ID = 'EB02-022';

describe('EB02-022 Usopp', () => {
  const mk = (characters: string[], handCards: string[]) =>
    game(
      { leader: OTHER_LEADER, characters, hand: [ID, ...handCards], costArea: TEN },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: with 2 or less Characters of 5000 power or more (Usopp counts), plays a 6000-or-less Character with no base effect', () => {
    // Usopp (5000) and one other 5000: 2 Characters with 5000 power or more, so it fires.
    const g = mk([V.c3], [V.c4, V.c5, WITH_ON_PLAY]);
    inert(g, WITH_ON_PLAY);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // 6000 is offered, 7000 is not, and a card with a base effect is not.
    expect(pickableCards(g)).toEqual([V.c4]);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3, ID, V.c4]);
    expect(hand(g, 'p1')).toEqual([V.c5, WITH_ON_PLAY]);
  });

  it('must not fire with 3 Characters of 5000 power or more: no prompt, nothing played', () => {
    const g = mk([V.c3, V.c4], [V.c2]);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    // Usopp, a 5000 and a 6000: three. The effect asks nothing.
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('reads current power: 4000 does not count, 4000 boosted to 5000 does', () => {
    const low = mk([V.c2, V.c2, V.c3], [V.c4]);
    low.act({ type: 'playCard', card: low.find('p1', 'hand', ID) });
    // Usopp and the 5000 only: 2, so it fires (the two 4000s do not count).
    expect(asks(low)).toBe(true);
    const boosted = mk([V.c2, V.c3], [V.c4]);
    boost(boosted, boosted.find('p1', 'characters', V.c2), 1000);
    boosted.act({ type: 'playCard', card: boosted.find('p1', 'hand', ID) });
    // Usopp, the 5000 and the boosted 4000: 3, so nothing is asked.
    expect(dec(boosted)?.kind).toBe('main');
  });

  it('plays only a Character of 6000 power or less: the boundary: 6000 yes, 7000 and a [Trigger] Character no', () => {
    const g = mk([], [V.c4, V.c5, AK.p6, TRIGGER_ONLY, V.c1]);
    inert(g, TRIGGER_ONLY);
    play(g, ID);
    // V.c4 and AK.p6 are 6000 (offered), V.c1 is 3000 (offered); 7000 and the [Trigger] Character are not.
    expect(pickableCards(g).sort()).toEqual([V.c1, V.c4, AK.p6].sort());
  });

  it('"up to 1": can play nothing, and the prompt is asked even when no card qualifies', () => {
    const g = mk([], [V.c4]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    // A hand with nothing eligible is asked all the same (the opponent learns nothing from the pause).
    const h = mk([], [V.c5]);
    h.act({ type: 'playCard', card: h.find('p1', 'hand', ID) });
    expect(asks(h)).toBe(true);
    expect(pickableCards(h)).toEqual([]);
  });
});

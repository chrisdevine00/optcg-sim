/** EB03-007 Baccarat. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import {
  asks,
  game,
  inert,
  koBy,
  pickableCards,
  TRIGGER_ONLY,
  WITH_ON_PLAY,
} from './helpers-w6c1.ts';

const ID = 'EB03-007';

describe('EB03-007 Baccarat', () => {
  const mk = (handCards: string[], characters: string[] = [ID]) =>
    game({ leader: PLAIN_PURPLE, characters, hand: handCards }, { leader: PLAIN_BLUE });

  it('has [Blocker]', () => {
    const g = mk([]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On K.O.]: plays a Character of 6000 power or less with no base effect from your hand', () => {
    const g = mk([V.c4, V.c5, WITH_ON_PLAY]);
    inert(g, WITH_ON_PLAY);
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    // 6000 is in, 7000 is out, a Character with a base effect is out.
    expect(pickableCards(g)).toEqual([V.c4]);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c4]);
    expect(hand(g, 'p1')).toEqual([V.c5, WITH_ON_PLAY]);
  });

  it('a Character with only a [Trigger] has a base effect and is not offered (M6b-Q70); a lower-power vanilla is', () => {
    const g = mk([TRIGGER_ONLY, V.c1]);
    inert(g, TRIGGER_ONLY);
    koBy(g, 'p1', ID, 'p2');
    expect(pickableCards(g)).toEqual([V.c1]);
  });

  it('"up to 1": may play nothing', () => {
    const g = mk([V.c4]);
    koBy(g, 'p1', ID, 'p2');
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });

  it('is asked with nothing eligible in hand, and does not fire when another Character is K.O.’d', () => {
    const g = mk([V.c5]);
    koBy(g, 'p1', ID, 'p2');
    expect(asks(g)).toBe(true);
    expect(pickableCards(g)).toEqual([]);
    const h = mk([V.c4], [ID, V.c1]);
    koBy(h, 'p1', V.c1, 'p2');
    expect(dec(h)?.kind).toBe('main');
    expect(hand(h, 'p1')).toEqual([V.c4]);
  });
});

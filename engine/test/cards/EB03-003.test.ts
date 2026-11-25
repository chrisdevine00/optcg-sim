/** EB03-003 Uta. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import {
  asks,
  game,
  inert,
  OTHER_LEADER,
  pickableCards,
  TEN,
  UTA_LEADER,
  WITH_ON_PLAY,
} from './helpers-w6c1.ts';

const ID = 'EB03-003';

describe('EB03-003 Uta', () => {
  const mk = (leader: string, handCards: string[], deck?: string[], characters: string[] = []) =>
    game(
      { leader, hand: [ID, ...handCards], costArea: TEN, characters, ...(deck ? { deck } : {}) },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: with [Uta] as your Leader, draws 2 cards, then plays a Character of 6000 power or less with no base effect from your hand', () => {
    const g = mk(UTA_LEADER, [V.c4, V.c5, WITH_ON_PLAY]);
    inert(g, WITH_ON_PLAY);
    const before = hand(g, 'p1').length - 1; // Uta leaves the hand
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(before + 2);
    expectDecision(g, 'choose', 'p1');
    // 6000 yes; 7000 no; a base effect no; the two drawn 3000 vanillas (BLUE) yes.
    expect(pickableCards(g).sort()).toEqual([V.c4, BLUE, BLUE].sort());
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, V.c4]);
  });

  it('a card just drawn may be the one played', () => {
    const g = mk(UTA_LEADER, [], [V.c4, V.c5, BLUE]);
    play(g, ID);
    // The two cards drawn are the top two: V.c4 and V.c5.
    expect(pickableCards(g)).toEqual([V.c4]);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(hand(g, 'p1')).toEqual([V.c5]);
  });

  it('must not fire without [Uta] as your Leader: nothing is drawn and nothing is played ("Then" is inside the "If")', () => {
    const g = mk(OTHER_LEADER, [V.c4]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('a Character named [Uta] on the field is not a Leader: it does not satisfy the condition', () => {
    const g = mk(OTHER_LEADER, [V.c4], undefined, ['EB03-003']);
    play(g, ID, 0);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });

  it('the play is "up to 1": it may be declined, and the draw still happened', () => {
    const g = mk(UTA_LEADER, [V.c4]);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('asks the play even when nothing in hand qualifies (the opponent learns nothing from the pause)', () => {
    const g = mk(UTA_LEADER, [V.c5], [V.c6, V.c7, BLUE]);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(asks(g)).toBe(true);
    expect(pickableCards(g)).toEqual([]);
  });
});

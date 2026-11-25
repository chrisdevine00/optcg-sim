/** EB03-039 Ulti. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import {
  AK,
  AKP_LEADER,
  game,
  inert,
  OTHER_LEADER,
  pickableCards,
  TEN,
  TRIGGER_ONLY,
  WITH_ON_PLAY,
} from './helpers-w6c1.ts';

const ID = 'EB03-039';

describe('EB03-039 Ulti', () => {
  const mk = (leader: string, handCards: string[], trashCards: string[] = [], deck?: string[]) =>
    game(
      {
        leader,
        hand: [ID, ...handCards],
        trash: trashCards,
        costArea: TEN,
        ...(deck ? { deck } : {}),
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: with an {Animal Kingdom Pirates} Leader, draws 1, trashes 1 from your hand, then plays a Character of 6000 power or less with no base effect from your trash', () => {
    const g = mk(AKP_LEADER, [V.c1], [AK.p6, AK.p7, WITH_ON_PLAY], [BLUE, BLUE]);
    inert(g, WITH_ON_PLAY);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1, BLUE]); // drawn
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE)]); // trash 1 card
    expect(trash(g, 'p1')).toContain(BLUE);
    expectDecision(g, 'choose', 'p1');
    // 6000 yes (boundary); 7000 no; a base effect no; the card just trashed (3000, vanilla) yes.
    expect(pickableCards(g).sort()).toEqual([AK.p6, BLUE].sort());
    pick(g, [g.find('p1', 'trash', AK.p6)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, AK.p6]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('the card just trashed from the hand may itself be played', () => {
    const g = mk(AKP_LEADER, [V.c4], [], [V.c5, BLUE]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(pickableCards(g)).toEqual([V.c4]);
    pick(g, [g.find('p1', 'trash', V.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, V.c4]);
    expect(hand(g, 'p1')).toEqual([V.c5]);
  });

  it('must not fire without an {Animal Kingdom Pirates} Leader: no draw, no trash, no play', () => {
    const g = mk(OTHER_LEADER, [V.c1], [AK.p6]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([AK.p6]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('"up to 1": the trashed card is still gone when nothing is played', () => {
    const g = mk(AKP_LEADER, [V.c1], [AK.p6], [BLUE, BLUE]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(trash(g, 'p1')).toContain(V.c1);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('a [Trigger]-only Character in the trash has a base effect and is not offered', () => {
    const g = mk(AKP_LEADER, [V.c1], [TRIGGER_ONLY], [BLUE, BLUE]);
    inert(g, TRIGGER_ONLY);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(pickableCards(g)).toEqual([V.c1]);
  });
});

/**
 * OP09-019 Nobody Hurts a Friend of Mine!!!! (Event, Red, cost 2, {Red-Haired Pirates}).
 *
 * Card text: "[Main] If your Leader has the "Red-Haired Pirates" type, give up to 1 of your opponent's
 * Characters -3000 power during this turn. Then, if your opponent has a Character with 5000 or more
 * power, draw 1 card.
 * [Trigger] Draw 1 card."
 *
 * Rules: CR 8-4-4 ("up to"), a colon-less "If" is an effect condition, "Then" after a failed "If" does
 * not resolve (M4b-5), power is read at the time the "Then" is checked.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  choices,
  deck,
  endTurn,
  hand,
  hitLeader,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-019';

function start(o: { leader?: string; opp?: string[]; hand?: string[]; deckTop?: string[] } = {}) {
  const g = mine(
    o.leader ?? L9.rhp,
    { hand: [ID, ...(o.hand ?? [])], deck: [...(o.deckTop ?? [C9.c2]), ...Array(10).fill(BLUE)] },
    { characters: o.opp ?? [C9.c4, C9.c5] },
  );
  playId(g, ID);
  return g;
}

describe('OP09-019 Nobody Hurts a Friend of Mine!!!!: [Main] -3000 power, then draw if an opposing Character has 5000+', () => {
  it('Red-Haired Pirates Leader: the chosen Character gets -3000 this turn, then 1 card is drawn (other Character has 7000)', () => {
    const g = start();
    need(g, 'choose', 'p1');
    pickCards(g, [C9.c4]);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', C9.c5))).toBe(7000);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C9.c2]);
    expect(deck(g)).toHaveLength(10);
    expect(trash(g)).toEqual([ID]);
  });

  it('offers exactly the opposing Characters (never my own Characters or either Leader)', () => {
    const g = mine(L9.rhp, { hand: [ID], characters: [C9.c3] }, { characters: [C9.c4, C9.c5] });
    playId(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c4, C9.c5].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('the draw checks the power AFTER the reduction: the only opposing Character at 7000 drops to 4000, no draw', () => {
    const g = start({ opp: [C9.c5] });
    pickCards(g, [C9.c5]);
    expect(g.power(g.find('p2', 'characters', C9.c5))).toBe(4000);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
  });

  it('boundary: another opposing Character with exactly 5000 power qualifies for the draw', () => {
    const g = start({ opp: [C9.c2, C9.c3] });
    pickCards(g, [C9.c2]);
    expect(hand(g)).toEqual([C9.c2]);
  });

  it('boundary: opposing Characters of 4000 and 3000 only: nothing has 5000 or more, no draw', () => {
    const g = start({ opp: [C9.c2, C9.c1] });
    pickCards(g, [C9.c1]);
    expect(hand(g)).toEqual([]);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: a Character at 8000 drops to exactly 5000 and still counts (5000 or more): draw', () => {
    const g = start({ opp: [C9.c6] });
    pickCards(g, [C9.c6]);
    expect(g.power(g.find('p2', 'characters', C9.c6))).toBe(5000);
    expect(hand(g)).toEqual([C9.c2]);
  });

  it('a Leader without the type: no -3000, no draw, the Event is still spent (colon-less "If")', () => {
    const g = start({ leader: L9.neutral });
    expect(kind(g)).not.toBe('choose');
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(11);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": choosing nothing changes no power', () => {
    const g = start();
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
    expect(g.power(g.find('p2', 'characters', C9.c5))).toBe(7000);
  });

  it('the reduction lasts only for this turn', () => {
    const g = start();
    pickCards(g, [C9.c4]);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(3000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
  });

  it('with no opposing Character nothing is reduced and nothing is drawn', () => {
    const g = start({ opp: [] });
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('must not be playable as a [Counter]: it has only a [Main] effect', () => {
    const g = theirs(
      L9.rhp,
      { hand: [ID], costArea: { active: 4, rested: 0 } },
      { characters: [C9.c4] },
    );
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
  });
});

describe('OP09-019 [Trigger] draw 1 card', () => {
  function hit() {
    const g = theirs(L9.rhp, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [C9.c4, C9.c5, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating draws exactly 1 card and the Event is trashed', () => {
    const g = hit();
    activateTrigger(g);
    expect(hand(g)).toEqual([C9.c4]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('the [Trigger] does not need the Leader type or an opposing Character: it draws with a plain Leader', () => {
    const g = theirs(L9.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      deck: [C9.c4, ...Array(10).fill(BLUE)],
    });
    hitLeader(g);
    activateTrigger(g);
    expect(hand(g)).toEqual([C9.c4]);
  });

  it('declining puts the Event into my hand and draws nothing', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(deck(g)).toHaveLength(12);
  });
});

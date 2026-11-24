/**
 * OP14-116 Salamander (Event, Yellow, cost 4, {Kuja Pirates}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.
 * Then, play up to 1 {Amazon Lily} or {Kuja Pirates} type Character card with a cost of 4 or less
 * from your hand.
 * [Trigger] Draw 1 card."
 *
 * Rules: CR 10-2-4 ([Counter]), CR 7-1-3, CR 6-6-1, CR 8-4-4 ("up to"), CR 10-1-5 ([Trigger]).
 * An attacker wins a tie.
 */
import { describe, expect, it } from 'vitest';
import {
  askedEmpty,
  at,
  atMain,
  attack,
  BLUE,
  canCounterNow,
  chars,
  choices,
  deckTop,
  don,
  hand,
  hitLeader,
  activateTrigger,
  kind,
  KJ,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  pickInst,
  SC14,
  theirs,
  trash,
  useCounter,
} from './kit-op14d.ts';

const ID = 'OP14-116';

function defend(o: { hand?: string[]; chars?: string[]; attacker?: string; active?: number } = {}) {
  const attacker = o.attacker ?? SC14.c4;
  const g = theirs(
    LD14.kuja,
    {
      hand: [ID, ...(o.hand ?? [KJ.sweetpea4])],
      characters: o.chars ?? [],
      life: [BLUE, BLUE, BLUE, BLUE],
      costArea: { active: o.active ?? 4, rested: 0 },
    },
    { characters: [attacker] },
  );
  attack(g, g.find('p2', 'characters', attacker), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP14-116 Salamander: [Counter] +2000, then play an Amazon Lily / Kuja Pirates Character with cost 4 or less from hand', () => {
  it('Leader +2000 stops a 6000 attack on my 5000 Leader, then a 4-cost Amazon Lily Character is played from my hand', () => {
    const g = defend();
    expect(kind(g)).toBe('counter');
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    need(g, 'choose', 'p1');
    pickCards(g, [KJ.sweetpea4]);
    expect(chars(g)).toEqual([KJ.sweetpea4]);
    expect(g.card(at(g, 'p1', 'characters', KJ.sweetpea4)).rested).toBe(false);
    expect(hand(g)).toEqual([BLUE].slice(0, 0));
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('boost candidates: my Leader and my Characters only (the attacking opposing Character is not offered)', () => {
    const g = defend({ chars: [SC14.c2] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([SC14.c2, LD14.kuja].sort());
  });

  it('the boost may go to a Character instead of the Leader', () => {
    const g = defend({ chars: [SC14.c2], hand: [] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    pickCards(g, [SC14.c2]);
    expect(g.power(at(g, 'p1', 'characters', SC14.c2))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('play candidates: cost 4 or less of either type; cost 5 and untyped cards are not offered', () => {
    const g = defend({ hand: [KJ.sweetpea4, KJ.ran4, KJ.shakuyaku5, KJ.rindo5, SC14.c2] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KJ.sweetpea4, KJ.ran4].sort());
  });

  // DISAGREEMENT D-1 (DISAGREEMENTS-d.md): the engine skips the "play up to 1 ... from your hand"
  // prompt when no card in the hand qualifies, so the opponent can tell the hand holds no match.
  it('with nothing in hand that qualifies the "up to 1" play is still asked (the hand is hidden), empty', () => {
    const g = defend({ hand: [SC14.c2, KJ.rindo5] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    // Raw pick: `pickInst` would also answer the empty play pick that follows with `done`.
    g.act({ type: 'pick', choice: g.leader('p1') });
    askedEmpty(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SC14.c2, KJ.rindo5].sort());
  });

  it('"up to 1": the Character may be left in hand, and at most one is played', () => {
    const g = defend({ hand: [KJ.sweetpea4, KJ.ran4] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([KJ.sweetpea4, KJ.ran4].sort());
  });

  it('"Then" is independent of the boost: with no boost target chosen the Character is still played', () => {
    const g = defend();
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    none(g);
    need(g, 'choose', 'p1');
    pickCards(g, [KJ.sweetpea4]);
    expect(chars(g)).toEqual([KJ.sweetpea4]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts only for this battle', () => {
    const g = defend({ hand: [] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1'); // the "play up to 1" pick is still asked (empty hand): answer it
    none(g);
    g.act({ type: 'endCounter' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('costs 4 DON!!: with exactly 4 active it can be used (all rested); with 3 it cannot', () => {
    const g = defend({ hand: [] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
    const h = defend({ active: 3 });
    expect(canCounterNow(h, h.find('p1', 'hand', ID))).toBe(false);
  });

  it('must not be playable in my own Main Phase: it has no [Main] effect', () => {
    const g = mine(LD14.kuja, { hand: [ID] });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe('OP14-116 Salamander: [Trigger] draw 1 card', () => {
  function hit() {
    const g = theirs(
      LD14.kuja,
      { life: [ID, BLUE, BLUE, BLUE], deck: deckTop([SC14.c4, SC14.c5]) },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('activating draws exactly 1 card; the Event is trashed', () => {
    const g = hit();
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC14.c4]);
    expect(trash(g)).toEqual([ID]);
  });

  it('declining puts the Event in my hand and draws nothing', () => {
    const g = hit();
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(12);
  });
});

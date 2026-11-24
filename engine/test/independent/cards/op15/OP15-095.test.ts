/**
 * OP15-095 Gum-Gum Storm (Event, Black, cost 1, {Straw Hat Crew}).
 *
 * Card text:
 *   "[Main] You may rest 1 of your DON!! cards: If you have 15 or more cards in your trash, up to 1 of your
 *    {Straw Hat Crew} type Leader or Character cards gains +3000 power during this turn.
 *    [Counter] If you have 15 or more cards in your trash, up to 1 of your Leader or Character cards gains
 *    +4000 power during this battle."
 *
 * Rules relied on: CR 2-7-3 / RD 74 (an Event is trashed BEFORE its effect resolves, so it counts in
 * its own trash check: 14 cards before the play are 15 during resolution), CR 8-3-1 (cost before the
 * colon, "you may" optional, unpayable costs make the effect unusable), RD 122 (a failed condition
 * gates the effect), "during this turn" / "during this battle" durations, "up to" may choose nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  canCounterNow,
  chars,
  choices,
  don,
  eventCounterTargets,
  hand,
  junk,
  kind,
  LD15,
  mine,
  need,
  no,
  passBlock,
  payDon,
  playRaw,
  SC15,
  skipChoice,
  theirs,
  toMyNextMain,
  trash,
  unusable,
  useCounter,
  yes,
  chooseIfAsked,
  pickInst,
  noDefence,
} from './kit-op15c.ts';

const STORM = 'OP15-095';

/** Play the Event and pay its optional "rest 1 DON!!" cost; stops at the target choice (if any). */
function castMain(g: ReturnType<typeof mine>, rest = true) {
  playRaw(g, g.find('p1', 'hand', STORM));
  if (kind(g) === 'optional') {
    if (rest) {
      yes(g, 'p1');
      payDon(g, 1, 'costActive');
    } else no(g, 'p1');
  }
}

const mainGame = (trashN: number, opts: { active?: number } = {}) =>
  mine(
    LD15.shc,
    {
      hand: [STORM],
      trash: junk(trashN),
      characters: [SC15.shc3, SC15.red3],
      costArea: { active: opts.active ?? 10, rested: 0 },
    },
    { characters: [SC15.shc1] },
  );

describe('OP15-095 Gum-Gum Storm [Main]', () => {
  it('14 cards before the play (15 once the Event is trashed): my {Straw Hat Crew} Leader gains +3000', () => {
    const g = mainGame(14);
    castMain(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(trash(g)).toHaveLength(15);
  });

  it('the cost: 1 DON!! is rested for the Event and 1 more for "you may rest 1 of your DON!! cards"', () => {
    const g = mainGame(14);
    castMain(g);
    expect(don(g).active).toBe(8);
    expect(don(g).rested).toBe(2);
  });

  it('13 cards before the play (14 with the Event): the condition fails and nothing gains power', () => {
    const g = mainGame(13);
    castMain(g);
    expect(kind(g)).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', SC15.shc3))).toBe(5000);
    expect(atMain(g)).toBe(true);
  });

  it('only my {Straw Hat Crew} Leader or Characters are offered, not other Characters or the opponent’s', () => {
    const g = mainGame(14);
    castMain(g);
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).toContain(g.leader('p1'));
    expect(offered).toContain(at(g, 'p1', 'characters', SC15.shc3));
    expect(offered).not.toContain(at(g, 'p1', 'characters', SC15.red3));
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(at(g, 'p2', 'characters', SC15.shc1));
  });

  it('a {Straw Hat Crew} Character can be the target: +3000 on it only', () => {
    const g = mainGame(14);
    castMain(g);
    const c = at(g, 'p1', 'characters', SC15.shc3);
    pickInst(g, [c]);
    expect(g.power(c)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"during this turn": the +3000 is gone on my next turn', () => {
    const g = mainGame(14);
    castMain(g);
    pickInst(g, [g.leader('p1')]);
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"you may": declining the cost leaves everything unchanged (only the Event’s own cost is spent)', () => {
    const g = mainGame(14);
    castMain(g, false);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g).rested).toBe(1);
  });

  it('with only 1 active DON!! the Event can be played but the rest cost cannot be paid: no effect', () => {
    const g = mainGame(14, { active: 1 });
    playRaw(g, g.find('p1', 'hand', STORM));
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g).rested).toBe(1);
  });

  it('"up to 1": the target may be left empty', () => {
    const g = mainGame(14);
    castMain(g);
    skipChoice(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(chars(g)).toHaveLength(2);
  });
});

describe('OP15-095 Gum-Gum Storm [Counter]', () => {
  const defend = (trashN: number) => {
    const g = theirs(
      LD15.neutral,
      {
        hand: [STORM],
        trash: junk(trashN),
        characters: [SC15.red3],
        costArea: { active: 3, rested: 0 },
      },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  };

  it('14 cards before (15 with the Event): +4000 to my Leader during this battle wins it (9000 vs 5000)', () => {
    const g = defend(14);
    expect(canCounterNow(g, g.find('p1', 'hand', STORM))).toBe(true);
    useCounter(g, g.find('p1', 'hand', STORM), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('13 cards before (14 with the Event): no boost, the attack connects', () => {
    const g = defend(13);
    useCounter(g, g.find('p1', 'hand', STORM), g.leader('p1'));
    expect(kind(g)).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(5000);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('any Leader or Character of mine may be boosted, {Straw Hat Crew} or not, but not the opponent’s', () => {
    const g = defend(14);
    const targets = eventCounterTargets(g, g.find('p1', 'hand', STORM));
    expect(targets).toContain(g.leader('p1'));
    expect(targets).toContain(at(g, 'p1', 'characters', SC15.red3));
    expect(targets).not.toContain(g.leader('p2'));
  });

  it('the boost ends with the battle', () => {
    const g = defend(14);
    useCounter(g, g.find('p1', 'hand', STORM), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    noDefence(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([]);
  });
});

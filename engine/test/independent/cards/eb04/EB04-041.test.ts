/**
 * EB04-041 Stealth Black (Event, Purple, cost 3, {Straw Hat Crew}).
 *
 * Card text: "[Main] If your Leader is [Sanji] and you have 4 or more DON!! cards on your field, play
 * up to 1 [Sanji] with 6000 power or less from your hand or trash."
 * "[Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: "DON!! cards on your field" counts the cost area (active and rested) and DON!! given to
 * cards. The card is played without paying its cost, active. "Up to 1" may be none. The pick over
 * the hidden hand is asked even when nothing matches.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chars,
  decision,
  fill,
  hand,
  isRestedInst,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickRaw,
  playRaw,
  theirs,
  trash,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-041';
/** EB04-052 Sanji: Yellow, cost 4, 4000. */
const SANJI4 = 'EB04-052';
/** EB02-054 Sanji: Yellow, cost 5, 6000, [Blocker]. */
const SANJI6 = 'EB02-054';
/** OP11-051 Sanji: Blue, cost 6, 7000. */
const SANJI7 = 'OP11-051';
const SAI = 'OP01-012'; // Red, 4000, not named Sanji
const HAJ = 'OP01-018'; // Red, cost 4, 6000

function cast(opts: {
  leader?: string | { card: string; don: number };
  hand?: string[];
  trash?: string[];
  active?: number;
}): TestGame {
  const g = mine(opts.leader ?? LB.sanji, {
    hand: [ID, ...(opts.hand ?? [])],
    trash: opts.trash ?? [],
    deck: fill(BLUE, 10),
    costArea: { active: opts.active ?? 5, rested: 0 },
  });
  playRaw(g, ID);
  return g;
}

describe('EB04-041 Stealth Black [Main]: [Sanji] Leader and 4+ DON!!: play a [Sanji] (6000 or less) from hand or trash', () => {
  it('offers [Sanji] cards of 6000 power or less from the hand and the trash', () => {
    const g = cast({ hand: [SANJI4, SANJI7, SAI], trash: [SANJI6] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SANJI4, SANJI6].sort());
  });

  it('plays the chosen card from the hand, active and without paying its cost', () => {
    const g = cast({ hand: [SANJI4], trash: [SANJI6] });
    pickRaw(g, g.find('p1', 'hand', SANJI4));
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([SANJI4]);
    expect(isRestedInst(g, at(g, 'p1', 'characters', SANJI4))).toBe(false);
    // Event cost 3 rested 3 of 5 DON!!, nothing more
    expect(trash(g)).toEqual([ID, SANJI6].sort());
  });

  it('plays the chosen card from the trash', () => {
    const g = cast({ hand: [SANJI4], trash: [SANJI6] });
    pickRaw(g, g.find('p1', 'trash', SANJI6));
    expect(chars(g)).toEqual([SANJI6]);
    expect(hand(g)).toEqual([SANJI4]);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: 6000 power is allowed, 7000 is not', () => {
    const g = cast({ hand: [SANJI7], trash: [SANJI6] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SANJI6]);
  });

  it('"up to 1": may play nothing', () => {
    const g = cast({ hand: [SANJI4] });
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SANJI4]);
  });

  it('only cards named [Sanji]: another card is not offered', () => {
    const g = cast({ hand: [SAI, HAJ] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
  });

  it('with no [Sanji] anywhere the pick is still asked (the hand is hidden), with nothing to pick', () => {
    const g = cast({ hand: [SAI], trash: [] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: exactly 4 DON!! on the field is enough', () => {
    const g = cast({ hand: [SANJI4], active: 4 });
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', SANJI4));
    expect(chars(g)).toEqual([SANJI4]);
  });

  it('boundary: 3 DON!! on the field is not enough', () => {
    const g = cast({ hand: [SANJI4], active: 3 });
    if (kind(g) === 'choose') none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SANJI4]);
  });

  it('DON!! given to a card counts as DON!! on the field (3 in the cost area + 1 given)', () => {
    const g = cast({ leader: { card: LB.sanji, don: 1 }, hand: [SANJI4], active: 3 });
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', SANJI4));
    expect(chars(g)).toEqual([SANJI4]);
  });

  it('without a [Sanji] Leader nothing is played', () => {
    const g = cast({ leader: LB.luffy, hand: [SANJI4] });
    if (kind(g) === 'choose') none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SANJI4]);
  });
});

describe('EB04-041 Stealth Black [Trigger]: draw 2 cards and trash 1 card from your hand', () => {
  it('draws 2 and trashes 1 chosen card when revealed from Life', () => {
    const g = theirs(
      LB.sanji,
      { life: [ID, BLUE, BLUE, BLUE], hand: [SAI], deck: [HAJ, SANJI4, ...fill(BLUE, 8)] },
      { characters: [HAJ] },
    );
    attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    // hand: Sai + two drawn cards (Hajrudin, Sanji)
    expect(offeredIds(g)).toEqual([HAJ, SAI, SANJI4].sort());
    pickRaw(g, g.find('p1', 'hand', SAI));
    expect(decision(g)?.kind).toBe('main');
    expect(hand(g)).toEqual([HAJ, SANJI4].sort());
    expect(trash(g)).toContain(SAI);
  });
});

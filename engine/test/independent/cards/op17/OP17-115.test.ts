/**
 * OP17-115 Don't you know that even in the cruel world of pirates there's still a code of honor?!! (Event,
 * Yellow, cost 1, {The Four Emperors}/{Big Mom Pirates}).
 *
 * Card text: "[Main] Your [Charlotte Linlin] Leader gains [Unblockable] during this turn.
 * [Counter] Up to 1 of your [Charlotte Linlin] gains +4000 power during this battle."
 *
 * Rules: CR 2-1-2 ([Name] is the exact card name), CR 10-1-7 ([Unblockable]: the opponent cannot
 * activate [Blocker] against this attacker), CR 6-6-1-3 ("during this turn"), RL-08, CR 7-1-3-1-2.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  attack,
  atMain,
  blockers,
  choices,
  kind,
  kw,
  LD,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  pickInst,
  playCard,
  SCN,
  theirs,
  toMyNextMain,
  trash,
  RED,
  side,
  theirTurn,
  BLUE,
} from './kit-op17b.ts';

const EVENT = 'OP17-115';
const LINLIN_CHAR = 'ST34-004'; // Purple Character named [Charlotte Linlin], cost 10, 12000 ([On Play] only)
const BLOCKER = 'OP17-074'; // Purple Character, cost 3, 1000, [Blocker] (keyword in the card data)

describe("OP17-115 Don't you know... [Main]: my [Charlotte Linlin] Leader gains [Unblockable] this turn", () => {
  it('a [Charlotte Linlin] Leader gains [Unblockable]', () => {
    const g = mine(LD.linlin, { hand: [EVENT] });
    expect(kw(g, g.leader('p1'))).not.toContain('Unblockable');
    playCard(g, EVENT);
    expect(atMain(g)).toBe(true);
    expect(kw(g, g.leader('p1'))).toContain('Unblockable');
    expect(trash(g)).toEqual([EVENT]);
  });

  it("the opponent cannot block the Leader's attack with [Blocker]: no Blocker is a legal choice", () => {
    const g = mine(LD.linlin, { hand: [EVENT] }, { characters: [BLOCKER] });
    playCard(g, EVENT);
    attack(g, g.leader('p1'), g.leader('p2'));
    need(g, 'optional', 'p1'); // the Leader's own [When Attacking]
    no(g);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]); // the only legal answer is "do not block"
  });

  it('control: without the Event the same Blocker can block', () => {
    const g = mine(LD.linlin, {}, { characters: [BLOCKER] });
    attack(g, g.leader('p1'), g.leader('p2'));
    need(g, 'optional', 'p1');
    no(g);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([at(g, 'p2', 'characters', BLOCKER)]);
  });

  it('the name is what counts: another [Charlotte Linlin] Leader card (OP03-077) gains [Unblockable] too', () => {
    const g = mine('OP03-077', { hand: [EVENT] });
    playCard(g, EVENT);
    expect(kw(g, g.leader('p1'))).toContain('Unblockable');
  });

  it('another Leader (not named [Charlotte Linlin]) gains nothing', () => {
    const g = mine(LD.bmp, { hand: [EVENT] });
    playCard(g, EVENT);
    expect(kw(g, g.leader('p1'))).not.toContain('Unblockable');
  });

  it('only the Leader gains it: a [Charlotte Linlin] Character on my field does not', () => {
    const g = mine(LD.linlin, { hand: [EVENT], characters: [LINLIN_CHAR] });
    playCard(g, EVENT);
    expect(kw(g, at(g, 'p1', 'characters', LINLIN_CHAR))).not.toContain('Unblockable');
  });

  it('asks nothing when played and lasts this turn only', () => {
    const g = mine(LD.linlin, { hand: [EVENT] });
    playCard(g, EVENT);
    expect(kind(g)).toBe('main');
    toMyNextMain(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Unblockable');
  });
});

describe("OP17-115 Don't you know... [Counter]: up to 1 of my [Charlotte Linlin] +4000 during this battle", () => {
  function counterStep(leader: string, chars: string[] = []) {
    const g = theirTurn(
      side(leader, BLUE, { hand: [EVENT], characters: chars, costArea: { active: 1, rested: 0 } }),
      side(LD.luffy, RED, { costArea: { active: 10, rested: 0 } }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('boosts my [Charlotte Linlin] Leader by 4000 for the battle only', () => {
    const g = counterStep(LD.linlin);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a [Charlotte Linlin] Character is a target too; other Characters are not', () => {
    const g = counterStep(LD.linlin, [LINLIN_CHAR, SCN.c3]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(offeredIds(g)).toContain(LINLIN_CHAR);
    expect(offeredIds(g)).not.toContain(SCN.c3);
    pickCards(g, [LINLIN_CHAR]);
    expect(g.power(at(g, 'p1', 'characters', LINLIN_CHAR))).toBe(16000);
  });

  it('a Leader with another name is not a target (only a named Character is, if any)', () => {
    const g = counterStep(LD.bmp, [LINLIN_CHAR]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([LINLIN_CHAR]);
  });

  it('"up to 1": the target may be skipped', () => {
    const g = counterStep(LD.linlin);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boosts only 1 card: the Leader and a Character cannot both receive it', () => {
    const g = counterStep(LD.linlin, [LINLIN_CHAR]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(at(g, 'p1', 'characters', LINLIN_CHAR))).toBe(12000);
    void theirs;
  });
});

/**
 * OP15-038 It's an Order! Do Not Defy Me!!! (Event, Green, cost 1, {Krieg Pirates}/{East Blue}).
 *
 * Card text: "[Main] Up to 1 of your opponent's rested Characters with a cost of 8 or less that has
 * 2 or more DON!! cards given will not become active in your opponent's next Refresh Phase.
 * [Counter] Up to 1 of your [Krieg] cards gains +4000 power during this battle."
 *
 * Rules: CR 6-2 (Refresh Phase), CR 7-1-3 (Counter Step, boosts last for the battle), CR 7-1-4
 * (the attacker wins a power tie), CR 8-4-4-1 ("up to"). [Krieg] names the card's name exactly:
 * the Leader OP15-001 and the Character OP15-008 are named Krieg.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  cardIds,
  chooseIfAsked,
  chr,
  donW,
  endTurn,
  eventCounterTargets,
  kind,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  theirsW,
  takeDamage,
  trash,
  useCounter,
  W4,
} from './kit-w4a.ts';

const ORDER = 'OP15-038';
const KRIEG_LEADER = 'OP15-001';
const KRIEG_CHAR = 'OP15-008';

type Pl = string | { card: string; rested?: boolean; don?: number };

function mainBoard(p2chars: Pl[]) {
  return mine('ST01-001', { hand: [ORDER] }, { characters: p2chars });
}

describe("OP15-038 It's an Order!: [Main] a rested Character does not become active next Refresh", () => {
  it('printed values: Event, cost 1', () => {
    const g = mainBoard([]);
    expect(g.card(at(g, 'p1', 'hand', ORDER)).cost).toBe(1);
  });

  it('offers only rested Characters with cost 8 or less and 2+ DON!! (boundaries: cost 8/9, DON!! 1/2/3, active)', () => {
    const g = mainBoard([
      { card: W4.shiki8, rested: true, don: 2 }, // cost 8, 2 DON!!: yes
      { card: W4.mihawk9, rested: true, don: 2 }, // cost 9: no
      { card: W4.marco, rested: true, don: 1 }, // 1 DON!!: no
      { card: W4.kingdew, rested: true, don: 3 }, // yes
      { card: W4.hajrudin, don: 2 }, // active: no
    ]);
    playRaw(g, ORDER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.kingdew, W4.shiki8].sort());
  });

  it('the chosen Character stays rested in its next Refresh while an unchosen rested one becomes active', () => {
    const g = mainBoard([
      { card: W4.marco, rested: true, don: 2 },
      { card: W4.kingdew, rested: true, don: 2 },
      { card: W4.sai, rested: true },
    ]);
    playRaw(g, ORDER);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', W4.kingdew)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', W4.sai)).rested).toBe(false);
  });

  it('"up to 1": with two eligible Characters only the chosen one is held', () => {
    const g = mainBoard([
      { card: W4.marco, rested: true, don: 2 },
      { card: W4.kingdew, rested: true, don: 3 },
    ]);
    playRaw(g, ORDER);
    pickInst(g, [chr(g, 'p2', W4.kingdew)]);
    endTurn(g);
    expect(g.card(chr(g, 'p2', W4.kingdew)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
  });

  it('choosing nobody holds nobody', () => {
    const g = mainBoard([{ card: W4.marco, rested: true, don: 2 }]);
    playRaw(g, ORDER);
    need(g, 'choose', 'p1');
    none(g);
    endTurn(g);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
  });

  it('only the NEXT Refresh: a turn cycle later the Character is active again', () => {
    const g = mainBoard([{ card: W4.marco, rested: true, don: 2 }]);
    playRaw(g, ORDER);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    endTurn(g);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(true);
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
  });

  it("the Event is trashed after use and the opponent's Leader is not a candidate", () => {
    const g = mine(
      'ST01-001',
      { hand: [ORDER] },
      {
        leader: { card: W4.luffy, rested: true, don: 3 },
        characters: [{ card: W4.marco, rested: true, don: 2 }],
      },
    );
    playRaw(g, ORDER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.marco]);
    pickInst(g, [chr(g, 'p2', W4.marco)]);
    expect(trash(g, 'p1')).toEqual([ORDER]);
    expect(donW(g, 'p1').rested).toBe(1);
  });

  it('with no eligible Character nothing happens', () => {
    const g = mainBoard([
      { card: W4.marco, rested: true, don: 1 },
      { card: W4.sai, rested: true },
    ]);
    playRaw(g, ORDER);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g, 'p1')).toBe(true);
    endTurn(g);
    expect(g.card(chr(g, 'p2', W4.marco)).rested).toBe(false);
  });
});

describe("OP15-038 It's an Order!: [Counter] up to 1 of your [Krieg] cards gains +4000 this battle", () => {
  function defend(extra: string[] = []) {
    return theirsW(
      {
        leader: KRIEG_LEADER,
        characters: [W4.marco, ...extra],
        hand: [ORDER],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [W4.oars, W4.kingdew, W4.thatch] },
    );
  }

  it('offers only cards named Krieg: the Leader and a Krieg Character, not another Character', () => {
    const g = defend([KRIEG_CHAR]);
    attack(g, chr(g, 'p2', W4.oars), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    expect(eventCounterTargets(g, at(g, 'p1', 'hand', ORDER)).length).toBe(2);
    expect(
      eventCounterTargets(g, at(g, 'p1', 'hand', ORDER)).includes(chr(g, 'p1', W4.marco)),
    ).toBe(false);
  });

  it('+4000 makes the Leader (5000 -> 9000) beat a 8000 attacker', () => {
    const g = defend();
    attack(g, chr(g, 'p2', W4.thatch), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', ORDER), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    need(g, 'counter', 'p1');
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: a tie at 9000 vs 9000 goes to the attacker, so the Leader loses a Life', () => {
    const g = defend();
    attack(g, chr(g, 'p2', W4.oars), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', ORDER), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the boost ends with the battle', () => {
    const g = defend();
    attack(g, chr(g, 'p2', W4.thatch), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', ORDER), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('can boost a Krieg Character instead of the Leader (9000 -> 13000), leaving the Leader at 5000', () => {
    const g = defend([KRIEG_CHAR]);
    attack(g, chr(g, 'p2', W4.oars), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', ORDER), chr(g, 'p1', KRIEG_CHAR));
    chooseIfAsked(g, [chr(g, 'p1', KRIEG_CHAR)]);
    expect(g.power(chr(g, 'p1', KRIEG_CHAR))).toBe(13000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('costs 1 DON!! and the Event goes to the trash', () => {
    const g = defend();
    attack(g, chr(g, 'p2', W4.thatch), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', ORDER), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(donW(g, 'p1').rested).toBe(1);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ORDER]);
  });
});

/**
 * OP13-075 Guess We'll Have Another Scrap. You Can Only Risk Death While You're Still Alive!!
 * (Event, Purple, cost 1, {Roger Pirates}/{King of the Pirates}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards: If your Leader is [Gol.D.Roger] and you have
 * any DON!! cards given, add up to 1 DON!! card from your DON!! deck and rest it. [Counter] Your
 * Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-4 / E-Q12 ("you may" cost, may be declined after the Event is played), CR 8-3-1-3
 * (an unpayable cost: only an ACTIVE DON!! can be rested, given DON!! cannot), CR 2-1-2 ([Name] is an
 * exact name), E-Q11 (the count), CR 8-1-4-2 ("during this battle" ends with the battle).
 * The cost is written before the colon and the "If" after it, so the cost is paid first and the
 * condition is checked as the effect resolves: with a false condition the tests assert only that
 * no DON!! is added.
 * Leaders: OP13-003 Gol.D.Roger (named [Gol.D.Roger]), OP12-001 Silvers Rayleigh ({Former Roger
 * Pirates}: type includes Roger Pirates but is not [Gol.D.Roger]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  addDon,
  asksCount,
  atMain,
  attack,
  canCounterNow,
  ch,
  countOptions,
  defend,
  don,
  kind,
  LD13,
  me,
  need,
  no,
  offeredIds,
  passBlock,
  passCounter,
  playRaw,
  S13,
  yes,
  battleOn,
  unusable,
  type Placed,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-075';

function main(
  leader: string,
  o: { given?: number; active?: number; mineChars?: Placed } = {},
): TestGame {
  return me(
    { card: leader, don: o.given ?? 1 },
    { hand: [ID], characters: o.mineChars ?? [], costArea: { active: o.active ?? 4, rested: 0 } },
  );
}

/** Play the Event, accept the "you may" cost. */
function playAndPay(g: TestGame): void {
  playRaw(g, ID);
  need(g, 'optional', 'p1');
  yes(g, 'p1');
  // The rest-1 cost has one kind of DON!! to rest (active), so the engine may pay it by itself.
  if (
    kind(g) === 'choose' &&
    g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice)
  ) {
    const pay = g
      .legal()
      .find((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice);
    if (pay) g.act(pay);
  }
}

describe('OP13-075 [Main]: may rest 1 DON!!; if my Leader is [Gol.D.Roger] and DON!! is given, add up to 1 DON!! rested', () => {
  it('[Gol.D.Roger] with DON!! given: rests 1 DON!!, asks the count and adds 1 RESTED DON!!', () => {
    const g = main(LD13.roger);
    const before = don(g);
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    expect(atMain(g)).toBe(true);
    // 1 for the Event's cost, 1 for the "rest 1" cost, 1 added rested.
    expect(don(g)).toMatchObject({
      active: before.active - 2,
      rested: before.rested + 2 + 1,
      deck: before.deck - 1,
      given: 1,
    });
  });

  it('a Leader whose type merely includes Roger Pirates but is not [Gol.D.Roger] adds nothing', () => {
    const g = main(LD13.rogerPiratesLeader);
    const before = don(g);
    playAndPay(g);
    expect(asksCount(g)).toBe(false);
    expect(don(g).deck).toBe(before.deck);
  });

  it('[Gol.D.Roger] without DON!! given adds nothing', () => {
    const g = main(LD13.roger, { given: 0 });
    const before = don(g);
    playAndPay(g);
    expect(asksCount(g)).toBe(false);
    expect(don(g).deck).toBe(before.deck);
  });

  it('DON!! given to one of my Characters satisfies the condition', () => {
    const g = main(LD13.roger, { given: 0, mineChars: [{ card: S13.c3, don: 1 }] });
    playAndPay(g);
    expect(asksCount(g)).toBe(true);
  });

  it('"you may": declining the cost adds nothing and rests only the Event’s own cost', () => {
    const g = main(LD13.roger);
    const before = don(g);
    playRaw(g, ID);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({
      active: before.active - 1,
      rested: before.rested + 1,
      deck: before.deck,
    });
  });

  it('CR 8-3-1-3: with no active DON!! left after the Event’s cost, the "rest 1" cost cannot be paid', () => {
    const g = main(LD13.roger, { active: 1 });
    const before = don(g);
    playRaw(g, ID);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('"up to 1": choosing 0 adds nothing (the rest-1 cost stays paid)', () => {
    const g = main(LD13.roger);
    const before = don(g);
    playAndPay(g);
    addDon(g, 0);
    expect(don(g)).toMatchObject({ deck: before.deck, rested: before.rested + 2 });
  });

  it('with an empty DON!! deck the count is not asked', () => {
    const g = main(LD13.roger, { active: 9 });
    expect(don(g).deck).toBe(0);
    playAndPay(g);
    expect(asksCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
  });
});

describe('OP13-075 [Counter]: my Leader gains +3000 power during this battle', () => {
  function attacked(): TestGame {
    // p1's Leader OP12-001 (5000) is attacked by Kingdew (7000); the Event is in hand with 1 active DON!!.
    const g = defend(
      LD13.rogerPiratesLeader,
      { hand: [ID], costArea: { active: 1, rested: 0 } },
      { characters: [S13.c5] },
    );
    attack(g, ch(g, 'p2', S13.c5), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('control: without the Counter the 7000 attack beats the 5000 Leader (Life 4 to 3)', () => {
    const g = attacked();
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the Counter makes the Leader 8000 and the 7000 attack fails', () => {
    const g = attacked();
    const ev = g.find('p1', 'hand', ID);
    expect(canCounterNow(g, ev)).toBe(true);
    activateCounter(g, ev);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('"during this battle": the bonus is gone when the battle ends', () => {
    const g = attacked();
    activateCounter(g, g.find('p1', 'hand', ID));
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost goes to the Leader, not to an attacked Character, which is still K.O.’d', () => {
    const g = defend(
      LD13.rogerPiratesLeader,
      {
        hand: [ID],
        characters: [{ card: S13.c3, rested: true }],
        costArea: { active: 1, rested: 0 },
      },
      { characters: [S13.c5] },
    );
    attack(g, ch(g, 'p2', S13.c5), ch(g, 'p1', S13.c3));
    passBlock(g);
    need(g, 'counter', 'p1');
    activateCounter(g, g.find('p1', 'hand', ID));
    passCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    void battleOn;
    void offeredIds;
  });

  it('the Counter costs the Event’s cost 1: with no active DON!! it cannot be used', () => {
    const g = defend(
      LD13.rogerPiratesLeader,
      { hand: [ID], costArea: { active: 0, rested: 0 } },
      { characters: [S13.c5] },
    );
    attack(g, ch(g, 'p2', S13.c5), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });
});

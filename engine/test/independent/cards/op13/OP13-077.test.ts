/**
 * OP13-077 Go All the Way to the Top!! (Event, Purple, cost 1, {Former Roger Pirates}).
 *
 * Card text: "[Main] You may rest 3 of your DON!! cards: If you have any DON!! cards given, K.O. up to 1
 * of your opponent's Characters with 4000 base power or less and up to 1 of your opponent's
 * Characters with 3000 base power or less. [Counter] Your Leader gains +3000 power during this
 * turn."
 *
 * Rules: CR 8-3-1-4 / E-Q12 ("you may" cost), CR 8-3-1-3 (an unpayable cost: only ACTIVE DON!! can be
 * rested), CR 4-9-2 ("base" power), CR 4-8-1 ("up to"), CR 8-1-4-2 and CR 6-6-1-3 ("during this turn"
 * lasts to the end of the turn, past the battle). The cost precedes the colon, so with a false "If"
 * the tests assert only the outcome on the board.
 * Scenery: OP01-012 Sai (4000), OP01-010 Komachiyo (3000), OP01-023 Marco (5000).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  atMain,
  attack,
  canFinish,
  ch,
  chars,
  choices,
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
  pickInst,
  playRaw,
  reach,
  S13,
  trash,
  unusable,
  yes,
  type Placed,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-077';

function main(o: { given?: number; active?: number; theirs?: Placed } = {}): TestGame {
  return me(
    o.given === 0 ? LD13.plain : { card: LD13.plain, don: o.given ?? 1 },
    { hand: [ID], costArea: { active: o.active ?? 4, rested: 0 } },
    { characters: o.theirs ?? [S13.c2, S13.c1, S13.c3] },
  );
}

/** Play the Event and accept the rest-3 cost; leaves the first target pick pending. */
function playAndPay(g: TestGame): void {
  playRaw(g, ID);
  need(g, 'optional', 'p1');
  yes(g, 'p1');
  for (
    let i = 0;
    i < 4 &&
    kind(g) === 'choose' &&
    g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice);
    i++
  ) {
    g.act(
      g
        .legal()
        .find((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice)!,
    );
  }
}

describe('OP13-077 [Main]: may rest 3 DON!!; if DON!! is given, K.O. up to 1 base ≤4000 and up to 1 base ≤3000', () => {
  it('K.O.s a 4000-base and a 3000-base Character; the 5000-base one stays; the DON!! cost is 1 + 3', () => {
    const g = main();
    const before = don(g);
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c2, S13.c1].sort());
    pickInst(g, [ch(g, 'p2', S13.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c3]);
    expect(trash(g, 'p2')).toEqual([S13.c2, S13.c1].sort());
    expect(don(g).rested).toBe(before.rested + 4);
  });

  it('boundary: a 5000-base Character is never offered, in either pick', () => {
    const g = main({ theirs: [S13.c3, S13.c2] });
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c2]);
    pickInst(g, [ch(g, 'p2', S13.c2)]);
    if (kind(g) === 'choose') expect(choices(g)).toEqual([]);
    expect(chars(g, 'p2')).toEqual([S13.c3]);
  });

  it('the 3000 pick cannot take a 4000-base Character: after the 3000-base one is picked first, the Sai is not offered again', () => {
    const g = main({ theirs: [S13.c2, S13.c1] });
    playAndPay(g);
    need(g, 'choose', 'p1');
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    if (kind(g) === 'choose') expect(offeredIds(g)).not.toContain(S13.c2);
  });

  it('every reachable result K.O.s at most two Characters, never the 5000-base one, and can K.O. both small ones', () => {
    const g = main();
    playAndPay(g);
    const states = reach(g, 'p1', 'p2');
    expect(states.some((s) => s.includes(`${S13.c3}:T`))).toBe(false);
    const both = `${S13.c3}:A,${S13.c1}:T,${S13.c2}:T`.split(',').sort().join(',');
    expect(states).toContain(both);
  });

  it('each "up to 1" can be skipped on its own: skipping the first and taking the second', () => {
    const g = main();
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    need(g, 'choose', 'p1');
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    expect(chars(g, 'p2')).toEqual([S13.c2, S13.c3].sort());
  });

  it('with no DON!! given, nothing is K.O.’d', () => {
    const g = main({ given: 0 });
    playRaw(g, ID);
    if (kind(g) === 'optional') yes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([S13.c2, S13.c1, S13.c3].sort());
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('"you may": declining the cost K.O.s nothing and rests only the Event’s own DON!!', () => {
    const g = main();
    const before = don(g);
    playRaw(g, ID);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c2, S13.c1, S13.c3].sort());
    expect(don(g).rested).toBe(before.rested + 1);
  });

  it('CR 8-3-1-3: with only 2 active DON!! left after the Event’s cost, resting 3 cannot be paid', () => {
    const g = main({ active: 3 });
    playRaw(g, ID);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c2, S13.c1, S13.c3].sort());
  });
});

describe('OP13-077 [Counter]: my Leader gains +3000 power during this TURN', () => {
  it('the bonus lasts past the battle for the rest of the turn and is gone on my own turn', () => {
    const g = defend(
      LD13.rogerPiratesLeader,
      { hand: [ID], costArea: { active: 1, rested: 0 } },
      { characters: [S13.c5] },
    );
    attack(g, ch(g, 'p2', S13.c5), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    activateCounter(g, g.find('p1', 'hand', ID));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

/**
 * OP10-003 Sugar (Leader, Purple/Red, 5000, 4 Life, {Donquixote Pirates}).
 *
 * Card text: "[End of Your Turn] If you have a {Donquixote Pirates} type Character with 6000 power or
 * more, set up to 1 of your DON!! cards as active. [Opponent's Turn] [Once Per Turn] When you
 * activate an Event, add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: [End of Your Turn] sees "during this turn" boosts and given DON!! (CR 6-6-1-1, RL-09, the
 * official OP10-003 Q&A). The "If" has no colon: an effect condition. "Set up to 1 DON!!" and "add
 * up to 1 DON!!" may ask a count; the tests answer it only when asked. The opponent's-turn effect
 * is once per turn and only on the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  askedCount,
  at,
  attack,
  canUse,
  don,
  endTurn,
  kind,
  mine,
  need,
  passBlock,
  pickCount,
  pickInst,
  playRaw,
  theirs,
  useCounter,
  V10,
  VAN,
  type Chars,
} from './kit-op10a.ts';

const SUGAR = 'OP10-003';
/** EB05-009 Fight and Die with Me!!!: Red Event, cost 1, [Counter] Your Leader gains +3000 power during this battle. */
const GUARD = 'EB05-009';
/** OP05-115 Amaru: Yellow Event, cost 2, [Main] Up to 1 of your Leader or Character cards gains +3000 power during this turn. */
const AMARU = 'OP05-115';

/** My turn: 10 DON!!, `rested` of them rested; my Characters as given. */
function mineBoard(chars: Chars, rested = 2, hand: string[] = []) {
  return mine(SUGAR, { costArea: { active: 10 - rested, rested }, characters: chars, hand });
}

/** End my turn; the "up to 1" count question is asked and answered with `take`. Returns at p2's Main Phase. */
function endMyTurn(g: ReturnType<typeof mineBoard>, take = 1): void {
  endTurn(g);
  pickCount(g, take);
  need(g, 'main', 'p2');
}

describe('OP10-003 Sugar: [End of Your Turn] with a {Donquixote Pirates} Character with 6000 power or more, set 1 DON!! active', () => {
  it('printed values: 5000 power, 4 Life', () => {
    const g = mineBoard([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });

  it('7000 power: at the end of my turn 1 rested DON!! is set active', () => {
    const g = mineBoard([V10.diamante5], 2);
    endMyTurn(g);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('boundary: exactly 6000 power qualifies', () => {
    const g = mineBoard([V10.buffalo4], 2);
    expect(g.power(at(g, 'p1', 'characters', V10.buffalo4))).toBe(6000);
    endMyTurn(g);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('boundary: 5000 power does not qualify; nothing is asked', () => {
    const g = mineBoard([V10.bellamyDp], 2);
    endTurn(g);
    expect(askedCount(g)).toBe(false);
    need(g, 'main', 'p2');
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('a 5000 Character with 1 DON!! given has 6000 on my turn and qualifies at the End Phase', () => {
    const g = mine(SUGAR, {
      costArea: { active: 6, rested: 2 },
      characters: [{ card: V10.bellamyDp, don: 1 }],
    });
    expect(g.power(at(g, 'p1', 'characters', V10.bellamyDp))).toBe(6000);
    endMyTurn(g);
    expect(don(g)).toMatchObject({ active: 7, rested: 1, given: 1 });
  });

  it('a "during this turn" boost counts at the End Phase (official Q&A): 5000 + 3000', () => {
    const g = mineBoard([V10.bellamyDp], 2, [AMARU]);
    playRaw(g, AMARU);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', V10.bellamyDp)]);
    expect(g.power(at(g, 'p1', 'characters', V10.bellamyDp))).toBe(8000);
    // Amaru cost 2 rested 2 more DON!!: 4 rested now.
    const rested = don(g).rested;
    endMyTurn(g);
    expect(don(g).rested).toBe(rested - 1);
  });

  it('a 7000 Character that is not {Donquixote Pirates} does not qualify', () => {
    const g = mineBoard([VAN.kingdew], 2);
    endTurn(g);
    expect(askedCount(g)).toBe(false);
    need(g, 'main', 'p2');
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('only my own Characters count: an opposing {Donquixote Pirates} 7000 does not qualify', () => {
    const g = mine(
      SUGAR,
      { costArea: { active: 8, rested: 2 }, characters: [VAN.marco] },
      { characters: [V10.diamante5] },
    );
    endTurn(g);
    expect(askedCount(g)).toBe(false);
    need(g, 'main', 'p2');
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('"up to 1": may set none', () => {
    const g = mineBoard([V10.diamante5], 2);
    endTurn(g);
    pickCount(g, 0);
    need(g, 'main', 'p2');
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('with no rested DON!! nothing happens and nothing is asked', () => {
    const g = mineBoard([V10.diamante5], 0);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(don(g)).toMatchObject({ active: 10, rested: 0 });
  });

  it("it is [End of Your Turn]: at the end of the opponent's turn it does not fire", () => {
    const g = theirs(SUGAR, {
      characters: [V10.diamante5],
      costArea: { active: 3, rested: 3 },
    });
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(g.eventsOfType('EffectActivated')).toHaveLength(0);
    expect(g.eventsOfType('SetActive')).toHaveLength(0);
  });
});

describe("OP10-003 Sugar: [Opponent's Turn] [Once Per Turn] when you activate an Event, add 1 DON!! from the DON!! deck, active", () => {
  /** p2's turn: p1 holds `hand` Events, 5 active DON!!, 3 in the DON!! deck. p2's Marco attacks p1's Leader. */
  function defending(hand: string[]) {
    const g = theirs(
      SUGAR,
      { hand, costArea: { active: 5, rested: 0 }, donDeck: 5, characters: [VAN.marco] },
      { characters: [VAN.hajrudin] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.hajrudin), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it("activating a [Counter] Event on the opponent's turn adds 1 active DON!! from the DON!! deck", () => {
    const g = defending([GUARD]);
    useCounter(g, at(g, 'p1', 'hand', GUARD), g.leader('p1'));
    pickCount(g, 1);
    // The Event cost 1 rested 1 of 5; the added DON!! is active.
    expect(don(g)).toMatchObject({ active: 5, rested: 1 });
  });

  it('the DON!! is taken from the DON!! deck (3 -> 2) and ends up in the cost area', () => {
    const g = defending([GUARD]);
    const before = don(g);
    useCounter(g, at(g, 'p1', 'hand', GUARD), g.leader('p1'));
    pickCount(g, 1);
    const after = don(g);
    expect(after.active + after.rested).toBe(before.active + before.rested + 1);
    expect(after.deck).toBe(before.deck - 1);
  });

  it('"up to 1": may add none', () => {
    const g = defending([GUARD]);
    const before = don(g);
    useCounter(g, at(g, 'p1', 'hand', GUARD), g.leader('p1'));
    pickCount(g, 0);
    const after = don(g);
    expect(after.active + after.rested).toBe(before.active + before.rested);
    expect(after.deck).toBe(before.deck);
  });

  it('Once Per Turn: a second Event in the same turn adds nothing more', () => {
    const g = defending([GUARD, GUARD]);
    const before = don(g);
    useCounter(g, g.find('p1', 'hand', GUARD, 0), g.leader('p1'));
    pickCount(g, 1);
    useCounter(g, g.find('p1', 'hand', GUARD, 0), g.leader('p1'));
    // The second Event activates the Counter, but the once-per-turn DON!! effect is spent.
    expect(askedCount(g)).toBe(false);
    const after = don(g);
    expect(after.active + after.rested).toBe(before.active + before.rested + 1);
    expect(after.deck).toBe(before.deck - 1);
  });

  it('with an empty DON!! deck nothing is added', () => {
    const g = theirs(
      SUGAR,
      { hand: [GUARD], costArea: { active: 10, rested: 0 }, donDeck: 0, characters: [VAN.marco] },
      { characters: [VAN.hajrudin] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.hajrudin), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', GUARD), g.leader('p1'));
    expect(don(g).active + don(g).rested).toBe(10);
  });

  it('must not happen: on my own turn activating an Event adds no DON!!', () => {
    const g = mine(SUGAR, {
      hand: [AMARU],
      costArea: { active: 8, rested: 0 },
      donDeck: 2,
      characters: [VAN.marco],
    });
    playRaw(g, AMARU);
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(askedCount(g)).toBe(false);
    expect(don(g).deck).toBe(2);
    expect(don(g).active + don(g).rested).toBe(8);
    expect(canUse(g)).toBe(false);
  });
});

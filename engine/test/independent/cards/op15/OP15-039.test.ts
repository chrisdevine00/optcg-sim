/**
 * OP15-039 Rebecca (Leader, Blue, 5000, 5 Life, {Dressrosa}).
 *
 * Card text: "This Leader cannot attack. [Activate: Main] You may rest this Leader and return 1 of
 * your {Dressrosa} type Characters to the owner's hand: Play up to 1 {Dressrosa} type Character
 * card with a cost of 3 from your hand."
 *
 * Rules: CR 8-3-1 (costs are paid in text order and must be payable in full), CR 3-1-6 (an effect
 * plays a card without paying its cost), CR 8-4-4-1 ("up to"), CR 10-2-?: a Leader that cannot
 * attack stays a legal target.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canAttackAnything,
  chars,
  don,
  hand,
  kind,
  LD15,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  S15,
  SCN,
  useAbility,
  atMain,
} from './kit-op15a.ts';
import { act } from './kit-op15a.ts';

const GILLY = S15.gilly; // OP10-054 {Dressrosa} cost 3, 5000
const BELLAMY = S15.bellamy; // OP01-076 {Dressrosa} cost 2
const HAJRUDIN = S15.hajrudinD; // OP15-049 {Dressrosa} cost 5
const MARCO = SCN.c3; // OP01-023 cost 3, not Dressrosa

function board(
  chs: (string | { card: string; rested?: boolean })[],
  handCards: string[],
  leader: string | { card: string; rested?: boolean } = LD15.rebecca,
) {
  return mine(leader, { characters: chs, hand: handCards });
}
const leaderId = (g: ReturnType<typeof board>) => g.leader('p1');

/**
 * Activate (choosing to activate is choosing to pay the "you may" cost) and return `ret` when the
 * engine asks which Character to return. Stops at the play prompt.
 */
function pay(g: ReturnType<typeof board>, ret: string) {
  useAbility(g, leaderId(g));
  if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
  const d = need(g, 'choose', 'p1');
  if (d.purpose === 'cost') pickInst(g, [at(g, 'p1', 'characters', ret)]);
}

describe('OP15-039 Rebecca: cannot attack', () => {
  it('the Leader has no legal attack even when active, while my Characters do', () => {
    const g = board([BELLAMY], []);
    expect(canAttackAnything(g, leaderId(g))).toBe(false);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', BELLAMY))).toBe(true);
  });
});

describe('OP15-039 Rebecca: [Activate: Main] rest this Leader, return a {Dressrosa} Character: play a cost 3 {Dressrosa}', () => {
  it('is offered with an active Leader and a {Dressrosa} Character', () => {
    const g = board([BELLAMY], [GILLY]);
    expect(offeredAbilities(g, leaderId(g))).toHaveLength(1);
  });

  it('is not offered when the Leader is rested', () => {
    const g = board([BELLAMY], [GILLY], { card: LD15.rebecca, rested: true });
    expect(offeredAbilities(g, leaderId(g))).toEqual([]);
  });

  it('is not offered without a {Dressrosa} Character (a Character of another type does not pay it)', () => {
    expect(offeredAbilities(board([], [GILLY]), board([], [GILLY]).leader('p1'))).toEqual([]);
    const g = board([MARCO], [GILLY]);
    expect(offeredAbilities(g, leaderId(g))).toEqual([]);
  });

  it('rests the Leader, returns the chosen Character to hand and plays a cost 3 {Dressrosa} Character for free', () => {
    const g = board([BELLAMY], [GILLY]);
    pay(g, BELLAMY);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(GILLY);
    pickInst(g, [at(g, 'p1', 'hand', GILLY)]);
    need(g, 'main', 'p1');
    expect(g.card(leaderId(g)).rested).toBe(true);
    expect(chars(g)).toEqual([GILLY]);
    expect(hand(g)).toEqual([BELLAMY]);
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
  });

  it('only {Dressrosa} Characters with a cost of exactly 3 are offered (cost 2, cost 5 and a non-{Dressrosa} cost 3 are not)', () => {
    const g = board([BELLAMY], [GILLY, HAJRUDIN, MARCO]);
    pay(g, BELLAMY);
    // Bellamy (cost 2, {Dressrosa}) is back in hand but does not qualify either.
    expect(offeredIds(g)).toEqual([GILLY]);
  });

  it('the Character just returned can itself be played back when its cost is 3', () => {
    const g = board([GILLY], []);
    pay(g, GILLY);
    expect(offeredIds(g)).toEqual([GILLY]);
    pickInst(g, [at(g, 'p1', 'hand', GILLY)]);
    expect(chars(g)).toEqual([GILLY]);
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": choosing nothing still pays the cost (Leader rested, Character returned)', () => {
    const g = board([BELLAMY], [GILLY]);
    pay(g, BELLAMY);
    none(g);
    need(g, 'main', 'p1');
    expect(g.card(leaderId(g)).rested).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g).sort()).toEqual([BELLAMY, GILLY].sort());
  });

  it('with two {Dressrosa} Characters I choose which one is returned; the other stays', () => {
    const g = board([BELLAMY, HAJRUDIN], [GILLY]);
    useAbility(g, leaderId(g));
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect(offeredIds(g)).toEqual([BELLAMY, HAJRUDIN].sort());
    pickInst(g, [at(g, 'p1', 'characters', HAJRUDIN)]);
    none(g);
    expect(chars(g)).toEqual([BELLAMY]);
    expect(hand(g).sort()).toEqual([GILLY, HAJRUDIN].sort());
  });

  it('after use the Leader is rested, so it cannot be used a second time this turn', () => {
    const g = board([BELLAMY], [GILLY]);
    pay(g, BELLAMY);
    pickInst(g, [at(g, 'p1', 'hand', GILLY)]);
    expect(atMain(g)).toBe(true);
    expect(offeredAbilities(g, leaderId(g))).toEqual([]);
  });
});

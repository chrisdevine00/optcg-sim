/**
 * OP12-065 Emporio.Ivankov (Character, Purple, cost 6, 7000, Counter +1000, {Revolutionary Army}/
 * {Impel Down}).
 *
 * Card text: "If you have 4 or more Events in your trash, this Character gains [Blocker]. [On K.O.] Add
 * up to 1 Event from your trash to your hand."
 *
 * Rules: the Blocker is a permanent effect read live; only Event cards in my trash count.
 * [On K.O.] (CR 10-2-17) fires when this Character is K.O.'d (battle or effect) and not when it
 * leaves the field another way; it is resolved with Ivankov already in the trash. "Up to 1" may be
 * none, and only my own trash is searched.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  hand,
  kind,
  kw,
  LB,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  passCounter,
  pickInst,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const IVAN = 'OP12-065';
const EV = SB.event;
/** OP12-057 Ice Block Pheasant Peck: another Event (different card). */
const EV2 = 'OP12-057';

/** p2's Thatch (8000) K.O.s my rested Ivankov (7000) in battle; p1's trash is `t`, p2's `t2`. */
function koed(t: string[], t2: string[] = []): TestGame {
  const g = theirs(
    LB.croc,
    { characters: [{ card: IVAN, rested: true }], trash: t },
    { characters: [SB.thatch], trash: t2 },
  );
  attack(g, g.find('p2', 'characters', SB.thatch), g.find('p1', 'characters', IVAN));
  noDefence(g);
  return g;
}

describe('OP12-065 Emporio.Ivankov: 4+ Events: [Blocker]; [On K.O.] add up to 1 Event from trash to hand', () => {
  it('with 4 Events in my trash it has [Blocker]', () => {
    const g = mine(LB.croc, { characters: [IVAN], trash: [EV, EV, EV, EV] });
    expect(kw(g, g.find('p1', 'characters', IVAN))).toContain('Blocker');
  });

  it('boundary: with 3 Events (and plenty of Characters) it has no [Blocker]', () => {
    const g = mine(LB.croc, { characters: [IVAN], trash: [EV, EV, EV, SB.sai, SB.sai, SB.sai] });
    expect(kw(g, g.find('p1', 'characters', IVAN))).not.toContain('Blocker');
  });

  it("must not: Events in the opponent's trash do not give [Blocker]", () => {
    const g = mine(LB.croc, { characters: [IVAN], trash: [EV] }, { trash: [EV, EV, EV, EV] });
    expect(kw(g, g.find('p1', 'characters', IVAN))).not.toContain('Blocker');
  });

  it('the granted [Blocker] can block an attack on my Leader', () => {
    const g = theirs(
      LB.croc,
      { characters: [IVAN], trash: [EV, EV, EV, EV] },
      { characters: [SB.hajrudin] },
    );
    attack(g, g.find('p2', 'characters', SB.hajrudin), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', IVAN)]);
  });

  it('[On K.O.] offers only Event cards of my trash and adds the chosen one to my hand', () => {
    const g = koed([EV, EV2, SB.sai, SB.marco]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EV, EV2].sort());
    pickInst(g, [g.find('p1', 'trash', EV2)]);
    expect(hand(g)).toEqual([EV2]);
    expect(trash(g)).toEqual([IVAN, EV, SB.sai, SB.marco].sort());
  });

  it('Ivankov himself is in the trash when it resolves (he is a Character, not offered)', () => {
    const g = koed([EV]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EV]);
    expect(trash(g)).toContain(IVAN);
  });

  it('"up to 1": may add nothing', () => {
    const g = koed([EV, EV2]);
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([IVAN, EV, EV2].sort());
  });

  it('adds at most 1 even when many Events are in the trash', () => {
    const g = koed([EV, EV, EV, EV2]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'trash', EV)]);
    expect(hand(g)).toEqual([EV]);
    expect(kind(g)).not.toBe('choose');
  });

  it('with no Event in my trash nothing is added', () => {
    const g = koed([SB.sai, SB.marco]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([]);
  });

  it("must not: Events in the opponent's trash are not offered", () => {
    const g = koed([EV], [EV2, EV2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EV]);
    act(g, { type: 'pick', choice: g.find('p1', 'trash', EV) });
    void passCounter;
  });
});

/**
 * OP12-066 Carne (Character, Purple, cost 1, 1000, Counter +1000, {East Blue}).
 *
 * Card text: "If you have 4 or more Events in your trash, this Character gains [Blocker]. (After your
 * opponent declares an attack, you may rest this card to make it the new target of the attack.)"
 *
 * Rules: a permanent effect read live (CR 8-1-3-3); only Event cards in MY trash count. [Blocker]
 * (CR 10-1-4) lets the active Character be made the new target in the Block Step.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  cast,
  chars,
  kw,
  LB,
  mine,
  need,
  passCounter,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';

const CARNE = 'OP12-066';
const EV = SB.event;
const CONCASSER = 'OP12-059';

describe('OP12-066 Carne: 4+ Events in my trash: [Blocker]', () => {
  it('with 4 Events in my trash it has [Blocker]', () => {
    const g = mine(LB.croc, { characters: [CARNE], trash: [EV, EV, EV, EV] });
    expect(kw(g, g.find('p1', 'characters', CARNE))).toContain('Blocker');
  });

  it('boundary: 3 Events is not enough', () => {
    const g = mine(LB.croc, { characters: [CARNE], trash: [EV, EV, EV] });
    expect(kw(g, g.find('p1', 'characters', CARNE))).not.toContain('Blocker');
  });

  it('only Event cards count: 3 Events and 5 Characters do not give [Blocker]', () => {
    const g = mine(LB.croc, { characters: [CARNE], trash: [EV, EV, EV, ...Array(5).fill(SB.sai)] });
    expect(kw(g, g.find('p1', 'characters', CARNE))).not.toContain('Blocker');
  });

  it("must not: Events in the opponent's trash do not count", () => {
    const g = mine(LB.croc, { characters: [CARNE] }, { trash: [EV, EV, EV, EV, EV] });
    expect(kw(g, g.find('p1', 'characters', CARNE))).not.toContain('Blocker');
  });

  it('the keyword turns on when the fourth Event is trashed (playing Concasser)', () => {
    const g = mine(LB.croc, { characters: [CARNE], hand: [CONCASSER], trash: [EV, EV, EV] });
    const c = g.find('p1', 'characters', CARNE);
    expect(kw(g, c)).not.toContain('Blocker');
    cast(g, CONCASSER);
    expect(kw(g, c)).toContain('Blocker');
  });

  it('with the keyword it can block an attack on my Leader (and is K.O.d by an 8000 attacker)', () => {
    const g = theirs(
      LB.croc,
      { characters: [CARNE], trash: [EV, EV, EV, EV] },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([g.find('p1', 'characters', CARNE)]);
    act(g, { type: 'block', blocker: g.find('p1', 'characters', CARNE) });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(chars(g)).toEqual([]);
    expect(trash(g).filter((c) => c === CARNE)).toHaveLength(1);
  });

  it('without the keyword (3 Events) it is not offered as a Blocker', () => {
    const g = theirs(
      LB.croc,
      { characters: [CARNE], trash: [EV, EV, EV] },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('a rested Carne cannot block even with 4 Events', () => {
    const g = theirs(
      LB.croc,
      { characters: [{ card: CARNE, rested: true }], trash: [EV, EV, EV, EV] },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('more Events change nothing: 6 Events give exactly one [Blocker] (a single block option)', () => {
    const g = theirs(
      LB.croc,
      { characters: [CARNE], trash: Array(6).fill(EV) },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
    expect(blockers(g)).toHaveLength(1);
  });
});

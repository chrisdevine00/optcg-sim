/**
 * OP15-059 Amazon (Character, Purple, cost 3, 0 power, Counter +1000, {Sky Island}).
 *
 * Card text: "[On Your Opponent's Attack] You may rest this Character: Your opponent may return 1 of
 * their active DON!! cards to their DON!! deck. If they do not, give up to 1 of your opponent's
 * Leader or Character cards -2000 power during this turn."
 *
 * Open: M6b-Q45 (the offer when the opponent has no active DON!!). That test asserts only that the
 * -2000 branch is reachable. Rules: "may rest" is a cost (CR 8-3-1); "may ... if they do not" is the
 * opponent's choice; "up to" allows 0 (CR 8-4-4-1); a -2000 lasts until the end of the turn; an
 * attacker whose power is below the defender's does not win the battle (CR 7-1-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  choices,
  deck,
  don,
  endUpTo,
  kind,
  need,
  no,
  passBlock,
  passCounter,
  pickInst,
  pickOption,
  theirs,
  unusable,
  W3C,
  W3L,
  yes,
  n,
  optionMatching,
} from './kit-w3.ts';

const AMAZON = 'OP15-059';

type P2 = Parameters<typeof theirs>[2];
/** p2's Leader attacks p1's Leader; stops at p1's "rest this card?" question. */
function attacked(p2: P2 = {}, p1Amazon: string | { card: string; rested: boolean } = AMAZON) {
  const g = theirs(
    W3L.kid,
    { characters: [p1Amazon] },
    { characters: [W3C.thatch], costArea: { active: 3, rested: 0 }, ...p2 },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  return {
    g,
    amazon: g.find('p1', 'characters', AMAZON),
    thatch: g.find('p2', 'characters', W3C.thatch),
  };
}
/** Finish the attack: no block, no counter. */
function finishBattle(g: ReturnType<typeof attacked>['g']) {
  passBlock(g);
  passCounter(g);
}

describe("OP15-059 Amazon: [On Your Opponent's Attack] you may rest this Character", () => {
  it('is offered when the opponent attacks, and accepting rests Amazon', () => {
    const { g, amazon } = attacked();
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(g.card(amazon).rested).toBe(true);
  });

  it('is offered when the attack is aimed at one of my Characters, not only at my Leader', () => {
    const g = theirs(
      W3L.kid,
      { characters: [AMAZON, { card: W3C.sai, rested: true }] },
      { characters: [W3C.thatch], costArea: { active: 3, rested: 0 } },
    );
    attack(g, g.find('p2', 'characters', W3C.thatch), g.find('p1', 'characters', W3C.sai));
    need(g, 'optional', 'p1');
  });

  it('declining: Amazon stays active, the opponent is asked nothing and the attack goes on', () => {
    const { g, amazon } = attacked();
    no(g, 'p1');
    expect(g.card(amazon).rested).toBe(false);
    need(g, 'block', 'p1');
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 0 });
  });

  it('the opponent chooses: returning 1 active DON!! to the DON!! deck means no power change', () => {
    const { g } = attacked();
    yes(g, 'p1');
    need(g, 'choose', 'p2');
    pickOption(g, /Return/);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 0, given: 0, deck: 8 });
    expect(g.power(g.leader('p2'))).toBe(5000);
    need(g, 'block', 'p1');
  });

  it('returns exactly 1 DON!!, and only an ACTIVE one (the rested ones stay)', () => {
    const { g } = attacked({ costArea: { active: 1, rested: 2 } });
    yes(g, 'p1');
    pickOption(g, /Return/);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 2, deck: 8 });
  });

  it('not returning: I give their Leader -2000 and their attack (now 3000 against my 5000) fails', () => {
    const { g } = attacked();
    yes(g, 'p1');
    pickOption(g, /Give/);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    expect(don(g, 'p2')).toMatchObject({ active: 3, deck: 7 });
    finishBattle(g);
    expect(g.life('p1')).toBe(4);
  });

  it('the -2000 may go to one of their Characters instead; the candidates are their Leader and Characters only', () => {
    const { g, amazon, thatch } = attacked();
    yes(g, 'p1');
    pickOption(g, /Give/);
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([g.leader('p2'), thatch].sort());
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(amazon);
    pickInst(g, [thatch]);
    expect(g.power(thatch)).toBe(6000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('"up to 1": may give nobody -2000', () => {
    const { g } = attacked();
    yes(g, 'p1');
    pickOption(g, /Give/);
    endUpTo(g);
    expect(g.power(g.leader('p2'))).toBe(5000);
    need(g, 'block', 'p1');
  });

  it('the -2000 lasts the whole turn, then ends with it', () => {
    const { g } = attacked();
    yes(g, 'p1');
    pickOption(g, /Give/);
    pickInst(g, [g.leader('p2')]);
    finishBattle(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p2'))).toBe(3000);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('an Amazon that is already rested cannot pay the cost: the effect is not used', () => {
    const { g } = attacked({}, { card: AMAZON, rested: true });
    unusable(g, 'p1');
    need(g, 'block', 'p1');
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(don(g, 'p2')).toMatchObject({ active: 3, deck: 7 });
  });

  it('M6b-Q45: when the opponent has no active DON!! they cannot return one, so the -2000 branch is reachable', () => {
    const { g } = attacked({ costArea: { active: 0, rested: 3 } });
    yes(g, 'p1');
    // Either the engine asks the opponent and only the "give" branch can be chosen, or it skips
    // the question; in both cases I then choose the target.
    if (kind(g) === 'choose' && g.decider === 'p2') {
      expect(() => optionMatching(g, /Give/)).not.toThrow();
      pickOption(g, /Give/);
    }
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(3000);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 3, deck: 7 });
    void deck;
    void n;
  });
});

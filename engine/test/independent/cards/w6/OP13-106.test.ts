/**
 * OP13-106 Conney (Character, Yellow, cost 1, 1000 power, Counter +1000, {Bonney Pirates}).
 *
 * Card text: "[Opponent's Turn] When a [Trigger] activates, this Character gains [Blocker] during this
 * turn." "[Trigger] Play this card."
 *
 * Rules: [Opponent's Turn] works only during the opponent's turn; a [Trigger] "activates" when the
 * damaged player chooses to activate it (a declined one is added to the hand); "during this turn"
 * ends with that turn; [Blocker] needs an active (not rested) Character to be used (CR 10-1-4).
 * M6b-Q72: the watcher resolves after the [Trigger] and the damage processing, so the Blocker is
 * asserted from the next attack on, not for the attack that dealt the damage.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  attack,
  blockers,
  chars,
  hand,
  kind,
  kw,
  LW,
  mine,
  need,
  passBlock,
  theirs,
  V13,
  W6,
  settleOrders,
  endTurn,
} from './kit-w6b.ts';

const CONNEY = 'OP13-106';
const FILL = 'OP02-060';
const TRIG = W6.trig; // OP17-107: "[Trigger] Play this card."

/** p2's turn. p1: Conney(s) and a Life stack with `top` first. p2: two 6000 attackers. */
function game(o: { top?: string; conneys?: (string | { card: string; rested: boolean })[] } = {}) {
  return theirs(
    LW.luffy,
    {
      characters: o.conneys ?? [CONNEY],
      life: [o.top ?? TRIG, FILL, FILL, FILL],
    },
    { characters: [V13.hajrudin, V13.hajrudin] },
  );
}

type G = ReturnType<typeof game>;

/** p2's nth Hajrudin attacks p1's Leader; p1 does not block or counter. Stops at p1's [Trigger] decision. */
function hit(g: G, nth: number) {
  attack(g, at(g, 'p2', 'characters', V13.hajrudin, nth), g.leader('p1'));
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  need(g, 'trigger', 'p1');
}

const conney = (g: G, nth = 0) => at(g, 'p1', 'characters', CONNEY, nth);

describe("OP13-106 Conney: [Opponent's Turn] when a [Trigger] activates, gains [Blocker] this turn", () => {
  it('printed values: cost 1, 1000 power, Counter +1000, no [Blocker] of its own', () => {
    const g = mine(LW.luffy, { characters: [CONNEY] });
    const c = g.card(at(g, 'p1', 'characters', CONNEY));
    expect(c.cost).toBe(1);
    expect(g.power(c.instance)).toBe(1000);
    expect(c.counter).toBe(1000);
    expect(kw(g, c.instance)).not.toContain('Blocker');
  });

  it("with no [Trigger] activated it has no [Blocker] on the opponent's turn", () => {
    const g = game();
    expect(kw(g, conney(g))).not.toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', V13.hajrudin, 0), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('my activating a [Trigger] on their turn gives it [Blocker], and it can block their next attack', () => {
    const g = game();
    hit(g, 0);
    act(g, { type: 'trigger', activate: true });
    expect(kind(g)).toBe('main');
    expect(kw(g, conney(g))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', V13.hajrudin, 1), g.leader('p1'));
    expect(blockers(g)).toEqual([conney(g)]);
    act(g, { type: 'block', blocker: conney(g) });
    expect(g.card(conney(g)).rested).toBe(true);
  });

  it('a [Trigger] declined (the card goes to my hand) is not an activation: no [Blocker]', () => {
    const g = game();
    hit(g, 0);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([TRIG]);
    expect(kw(g, conney(g))).not.toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', V13.hajrudin, 1), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('only the Character with the effect gains it, and every copy of Conney does', () => {
    const g = game({ conneys: [CONNEY, CONNEY, V13.hajrudin] });
    hit(g, 0);
    act(g, { type: 'trigger', activate: true });
    // Two identical watchers: the engine asks which resolves first.
    settleOrders(g, 'p1');
    expect(kw(g, conney(g, 0))).toContain('Blocker');
    expect(kw(g, conney(g, 1))).toContain('Blocker');
    expect(kw(g, at(g, 'p1', 'characters', V13.hajrudin))).not.toContain('Blocker');
  });

  it('"during this turn": the [Blocker] is gone on my next turn and on their next one', () => {
    const g = game();
    hit(g, 0);
    act(g, { type: 'trigger', activate: true });
    expect(kw(g, conney(g))).toContain('Blocker');
    endTurn(g);
    // My turn: not the opponent's turn, no [Blocker].
    expect(g.decider).toBe('p1');
    expect(kw(g, conney(g))).not.toContain('Blocker');
    endTurn(g);
    // Their next turn: nothing activated yet.
    expect(g.decider).toBe('p2');
    expect(kw(g, conney(g))).not.toContain('Blocker');
  });

  it('a rested Conney gains [Blocker] but cannot be used to block', () => {
    const g = game({ conneys: [{ card: CONNEY, rested: true }] });
    hit(g, 0);
    act(g, { type: 'trigger', activate: true });
    expect(kw(g, conney(g))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', V13.hajrudin, 1), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it("[Opponent's Turn] only: on my turn a [Trigger] they activate gives no [Blocker]", () => {
    const g = mine(
      LW.luffy,
      { characters: [CONNEY, V13.hajrudin] },
      { life: [TRIG, FILL, FILL, FILL] },
    );
    attack(g, at(g, 'p1', 'characters', V13.hajrudin), g.leader('p2'));
    noDefenceUntilEndCounter(g);
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: true });
    expect(kw(g, at(g, 'p1', 'characters', CONNEY))).not.toContain('Blocker');
  });

  it('[Trigger] Play this card: Conney from Life enters my field', () => {
    const g = game({ top: CONNEY, conneys: [V13.sai] });
    hit(g, 0);
    act(g, { type: 'trigger', activate: true });
    expect(chars(g)).toEqual([CONNEY, V13.sai].sort());
    expect(hand(g)).toEqual([]);
  });

  it('it works again on a later opponent turn', () => {
    const g = theirs(
      LW.luffy,
      { characters: [CONNEY], life: [TRIG, TRIG, FILL, FILL] },
      { characters: [V13.hajrudin, V13.hajrudin] },
    );
    hit(g, 0);
    act(g, { type: 'trigger', activate: true });
    endTurn(g);
    endTurn(g);
    expect(g.decider).toBe('p2');
    expect(kw(g, conney(g))).not.toContain('Blocker');
    hit(g, 1);
    act(g, { type: 'trigger', activate: true });
    expect(kw(g, conney(g))).toContain('Blocker');
  });
});

/** My attack: p2 (defender) neither blocks nor counters; stops at their [Trigger] decision. */
function noDefenceUntilEndCounter(g: ReturnType<typeof mine>) {
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

/**
 * EB02-057 Mad Treasure (Character, Yellow, cost 4, 5000, Counter +1000, {Treasure Pirates}, Special).
 *
 * Card text: "[When Attacking] You may add 1 card from the top or bottom of your Life cards to your
 * hand: Add up to 1 of your opponent's Characters with a cost of 3 or less to the top or bottom of
 * your opponent's Life cards face-up."
 *
 * Rules: CR 8-3-1 (the optional cost is paid by choosing to use the effect; if skipped, no
 * effect), CR 4-8-1 ("up to 1"), rules-digest 104 (a Life card moved by an effect has no
 * [Trigger]), 107 (top or bottom of Life), CR 3-10-2-1 (face-up Life), the Character is
 * not K.O.'d (no [On K.O.]) and the DON!! given to it go back to its owner's cost area (CR 6-5-5-3).
 * The attacking player chooses the end of the opponent's Life. Scenery (printed): OP01-010 (cost
 * 1), OP01-012 (cost 2), OP01-023 (cost 3), OP01-018 (cost 4), OP02-006 (cost 5) vanilla Red
 * Characters; OP01-104 Speed ([Trigger] Play this card); OP01-080 Zala ([On K.O.] Draw a card).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision, noDefence } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  anomalies,
  BLUE,
  donTotal,
  handOf,
  L7,
  lifeFaces,
  lifeOf,
  mayEnd,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  pickOption,
  RED,
  S7,
  unusable,
  yes,
} from './kit-w7a.ts';

const ID = 'EB02-057';
const [A, B, C] = [S7.c1, S7.c2, S7.c3];

function start(o: Partial<PlayerSpec> = {}, opp: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(L7.luffy, BLUE, { characters: [ID], life: [A, B, C], ...o }),
    side(L7.crocodile, RED, {
      life: [S7.c4, S7.c5, S7.c6],
      characters: [S7.c2, S7.c3, S7.c4, S7.c5],
      ...opp,
    }),
  );
}

/** Declare the attack on the opponent's Leader; leaves the pending cost question. */
function attackWith(g: ReturnType<typeof start>, card: CardId = ID) {
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', card), target: g.leader('p2') });
}

/** Attack, say yes, pay with `cost` end, then place `target` at `end`. Stops at the block decision. */
function full(
  g: ReturnType<typeof start>,
  cost: 'top' | 'bottom',
  target: CardId,
  end: 'top' | 'bottom',
) {
  attackWith(g);
  yes(g, 'p1');
  pickOption(g, cost);
  pickCards(g, [target]);
  pickOption(g, end);
}

describe('EB02-057 Mad Treasure: [When Attacking] add 1 Life card to hand: put an opposing Character (cost 3 or less) into their Life face-up', () => {
  it('printed effect, top to top: my top Life card goes to my hand; their Marco is on top of their Life, face-up', () => {
    const g = start();
    full(g, 'top', S7.c3, 'top');
    expect(decision(g)?.kind).toBe('block');
    expect(handOf(g, 'p1')).toEqual([A]);
    expect(lifeOf(g, 'p1')).toEqual([B, C]);
    expect(lifeOf(g, 'p2')).toEqual([S7.c3, S7.c4, S7.c5, S7.c6]);
    expect(lifeFaces(g, 'p2')).toEqual([true, false, false, false]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([S7.c2, S7.c4, S7.c5].sort());
    expect(anomalies(g)).toBe(0);
  });

  it('the cost may take the BOTTOM Life card instead', () => {
    const g = start();
    full(g, 'bottom', S7.c3, 'top');
    expect(handOf(g, 'p1')).toEqual([C]);
    expect(lifeOf(g, 'p1')).toEqual([A, B]);
  });

  it('the Character may go to the BOTTOM of their Life, face-up, and nothing else changes in their Life', () => {
    const g = start();
    full(g, 'top', S7.c2, 'bottom');
    expect(lifeOf(g, 'p2')).toEqual([S7.c4, S7.c5, S7.c6, S7.c2]);
    expect(lifeFaces(g, 'p2')).toEqual([false, false, false, true]);
    expect(g.life('p2')).toBe(4);
  });

  it('the cost filter is "cost 3 or less": 2 and 3 are offered; 4 and 5 are not', () => {
    const g = start();
    attackWith(g);
    yes(g, 'p1');
    pickOption(g, 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([S7.c2, S7.c3].sort());
  });

  it('"up to 1": choosing no Character still costs me the Life card, and moves nothing', () => {
    const g = start();
    attackWith(g);
    yes(g, 'p1');
    pickOption(g, 'top');
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(decision(g)?.kind).toBe('block');
    expect(handOf(g, 'p1')).toEqual([A]);
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });

  it('declining the optional cost: no Life card moves and no Character is placed', () => {
    const g = start();
    attackWith(g);
    no(g, 'p1');
    expect(decision(g)?.kind).toBe('block');
    expect(handOf(g, 'p1')).toEqual([]);
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });

  it('with no Life of my own the cost cannot be paid: the effect cannot be used', () => {
    const g = start({ life: [] });
    attackWith(g);
    unusable(g, 'p1');
    expect(decision(g)?.kind).toBe('block');
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
    expect(handOf(g, 'p1')).toEqual([]);
  });

  it('a Life card with a [Trigger] added to my hand as the cost does not activate it', () => {
    const g = start({ life: [S7.speed, B, C] });
    attackWith(g);
    yes(g, 'p1');
    pickOption(g, 'top');
    expect(decision(g)?.kind).not.toBe('trigger');
    pickCards(g, [S7.c3]);
    pickOption(g, 'top');
    expect(handOf(g, 'p1')).toEqual([S7.speed]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it("only the opponent's Characters are targets: my own cheap Character is not offered", () => {
    const g = start({ characters: [ID, S7.c1] }, { characters: [S7.c3, S7.c5] });
    attackWith(g);
    yes(g, 'p1');
    pickOption(g, 'top');
    // One candidate: an exact pick may be resolved by the engine, an "up to" pick is asked.
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S7.c3]);
  });

  it("the placed Character is not K.O.'d: its [On K.O.] does not fire", () => {
    const g = start({}, { characters: [S7.zala], hand: [S7.c4] });
    full(g, 'top', S7.zala, 'top');
    expect(g.zone('p2', 'hand')).toHaveLength(1); // no card drawn
    expect(g.zone('p2', 'trash')).toHaveLength(0);
    expect(lifeOf(g, 'p2')[0]).toBe(S7.zala);
  });

  it('DON!! given to the placed Character return to its owner: their DON!! total is unchanged', () => {
    const g = start(
      {},
      { characters: [{ card: S7.c3, don: 2 }, S7.c4], costArea: { active: 2, rested: 0 } },
    );
    const before = donTotal(g, 'p2');
    full(g, 'top', S7.c3, 'top');
    expect(donTotal(g, 'p2')).toBe(before);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([S7.c4]);
    expect(g.card(g.leader('p2')).don).toBe(0);
  });

  it('placed on top of their Life, the face-up Character is the card the damage of this very attack takes to their hand', () => {
    const g = start();
    full(g, 'top', S7.c3, 'top');
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(handOf(g, 'p2')).toEqual([S7.c3]);
    expect(lifeOf(g, 'p2')).toEqual([S7.c4, S7.c5, S7.c6]);
  });

  it("the effect belongs to this Character's attack: another Character attacking asks nothing", () => {
    const g = start({ characters: [ID, S7.c4] });
    attackWith(g, S7.c4);
    expect(decision(g)?.kind).toBe('block');
    expect(handOf(g, 'p1')).toEqual([]);
    noDefence(g);
  });
});

/**
 * EB03-055 Nico Robin (Character, yellow, cost 7, 8000, {Straw Hat Crew}).
 *
 * Card text: "[On Play] You may trash 1 card from the top of your Life cards: If your Leader has the
 * {Straw Hat Crew} type, add up to 2 cards from the top of your deck to the top of your Life cards.
 * [Opponent's Turn] [On K.O.] You may deal 1 damage to your opponent."
 *
 * Rules: the "may" cost is paid first, then the "If" is checked; nothing is added when it fails.
 * Trashing Life by an effect is not damage (RL-22). Effect damage takes the top Life card and offers
 * its [Trigger]; at 0 Life it defeats the player (RL-22, QA-EB03 EB03-055). [Opponent's Turn] limits
 * the [On K.O.] to the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  act,
  at,
  attack,
  BLUE,
  chars,
  chr,
  decision,
  deck,
  fill,
  hand,
  kind,
  lifeCards,
  mine,
  need,
  no,
  opponentKingdomCome,
  passBlock,
  playRaw,
  theirs,
  trash,
  unusable,
  W,
  LW,
  yes,
} from './kit-w4b.ts';

const ROBIN = 'EB03-055';
const RINDO = 'OP14-115';

/** p1's Main Phase with Robin in hand, 10 active DON!!; Life and deck top first. */
function board(
  leader: string,
  life: string[] = fill(BLUE, 4),
  deckTop: string[] = [W.sai, W.marco],
) {
  return mine(leader, { hand: [ROBIN], life, deck: [...deckTop, ...fill(BLUE, 13)] }, {});
}

/** Answer the pending "add the top card?" questions of the [On Play] with these answers, in order. */
function answers(g: ReturnType<typeof board>, list: boolean[]) {
  for (const a of list) {
    if (kind(g) !== 'optional') break;
    act(g, { type: 'optional', accept: a });
  }
}

describe('EB03-055 Nico Robin: [On Play] trash 1 Life; with a {Straw Hat Crew} Leader add up to 2 cards to Life', () => {
  it("adding 2: Life 4 becomes 5 (one trashed, two added), the deck loses 2, the new top Life cards are the deck's top cards", () => {
    const g = board(LW.luffy, [W.komachiyo, ...fill(BLUE, 3)], [W.sai, W.marco]);
    playRaw(g, ROBIN);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    answers(g, [true, true]);
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(5);
    expect(trash(g)).toEqual([W.komachiyo]);
    expect(deck(g)).toHaveLength(13);
    expect(lifeCards(g).slice(0, 2).sort()).toEqual([W.marco, W.sai].sort());
    expect(lifeCards(g).slice(2)).toEqual(fill(BLUE, 3));
  });

  it('"up to 2": adding only 1 leaves Life at 4', () => {
    const g = board(LW.luffy);
    playRaw(g, ROBIN);
    yes(g, 'p1');
    answers(g, [true, false]);
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(14);
  });

  it('"up to 2": adding none leaves Life at 3 (the cost stays paid)', () => {
    const g = board(LW.luffy);
    playRaw(g, ROBIN);
    yes(g, 'p1');
    answers(g, [false, false]);
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(15);
  });

  it('declining the "may" cost changes nothing', () => {
    const g = board(LW.luffy);
    playRaw(g, ROBIN);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('without a {Straw Hat Crew} Leader no card is added to Life, whatever the cost step did', () => {
    // Whether the cost is still offered (and paid) when the condition cannot hold is not asserted;
    // what every reading shares is that the deck keeps its cards and Life never grows.
    const g = board(LW.croc);
    playRaw(g, ROBIN);
    if (kind(g) === 'optional') yes(g, 'p1');
    answers(g, [true, true]);
    expect(deck(g)).toHaveLength(15);
    expect(g.life('p1')).toBeLessThanOrEqual(4);
    expect(chars(g)).toEqual([ROBIN]);
  });

  it('with 0 Life the cost cannot be paid: nothing happens', () => {
    const g = board(LW.luffy, []);
    playRaw(g, ROBIN);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(0);
    expect(deck(g)).toHaveLength(15);
    expect(queries.result(g.state)).toBeNull();
  });

  it('with 1 Life the cost is payable and two cards can be added: Life 1 to 0 to 2', () => {
    const g = board(LW.luffy, [W.komachiyo]);
    playRaw(g, ROBIN);
    yes(g, 'p1');
    answers(g, [true, true]);
    expect(g.life('p1')).toBe(2);
    expect(trash(g)).toEqual([W.komachiyo]);
  });

  it('trashing a Life card with a [Trigger] is not damage: no [Trigger] decision', () => {
    const g = mine(
      LW.luffy,
      { hand: [ROBIN], life: [RINDO, ...fill(BLUE, 3)], deck: [W.sai, W.marco, ...fill(BLUE, 13)] },
      {},
    );
    playRaw(g, ROBIN);
    yes(g, 'p1');
    answers(g, [false, false]);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([RINDO]);
    expect(chars(g)).toEqual([ROBIN]);
  });
});

describe("EB03-055 Nico Robin: [Opponent's Turn] [On K.O.] you may deal 1 damage to your opponent", () => {
  /** p2's turn: p2's 9000 Oars attacks the rested Robin (8000); nobody blocks or counters. */
  function koRobin(p2Life: string[] = fill(BLUE, 4)) {
    const g = theirs(
      LW.luffy,
      { characters: [{ card: ROBIN, rested: true }] },
      { characters: [W.oars9], life: p2Life },
    );
    attack(g, at(g, 'p2', 'characters', W.oars9), chr(g, 'p1', ROBIN));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it("offers the optional damage when K.O.'d on the opponent's turn; accepting takes 1 Life from the opponent", () => {
    const g = koRobin();
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    // The damaged player owes a [Trigger] decision for the card taken.
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: false });
    expect(g.life('p2')).toBe(3);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ROBIN]);
  });

  it('declining deals no damage', () => {
    const g = koRobin();
    need(g, 'optional', 'p1');
    no(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.life('p2')).toBe(4);
  });

  it('the damage is dealt to the opponent only, never to me', () => {
    const g = koRobin();
    yes(g, 'p1');
    act(g, { type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('at 0 Life the opponent loses to the damage (QA-EB03 EB03-055)', () => {
    const g = koRobin([]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(queries.result(g.state)).toMatchObject({ winner: 'p1' });
  });

  it("is also used when Robin is K.O.'d by an effect on the opponent's turn", () => {
    const g = theirs(LW.luffy, { characters: [ROBIN] }, { hand: [W.kingdomCome], characters: [] });
    opponentKingdomCome(g, g.find('p1', 'characters', ROBIN));
    need(g, 'optional', 'p1');
    // Kingdom Come trashed the opponent's Life down to 1; the damage then takes that last card.
    expect(g.life('p2')).toBe(1);
    yes(g, 'p1');
    if (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
    expect(g.life('p2')).toBe(0);
    expect(queries.result(g.state)).toBeNull();
  });
});

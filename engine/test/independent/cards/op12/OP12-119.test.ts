/**
 * OP12-119 Bartholomew Kuma (Character, Yellow, cost 6, 7000, Counter +1000, {Revolutionary Army}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Add up to 1 card from the top of your deck to
 * the top of your Life cards. Then, this Character gains +2 cost until the end of your opponent's next
 * End Phase. [Opponent's Turn] [On K.O.] Add up to 1 card from the top of your deck to the top of your
 * Life cards."
 *
 * Rules: CR 8-3-1-4 ("you may" cost: both sentences after the colon belong to the paid effect), CR 4-8-1
 * ("up to" allows 0), "until the end of your opponent's next End Phase" created on my turn lasts through
 * my turn and the opponent's whole turn, [Opponent's Turn] limits the [On K.O.] to the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  chars,
  deck,
  hand,
  isMain,
  kind,
  LDR,
  lifeCards,
  mine,
  need,
  no,
  optionChoicesOf,
  passBlock,
  pickCards,
  passCounter,
  payHand,
  playRaw,
  SCN,
  theirs,
  topDeck,
  trash,
  unusable,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-119';

function played(handExtra: string[] = [SCN.c2]) {
  const g = mine(LDR.neutral, { hand: [ID, ...handExtra], deck: topDeck([SCN.c6, SCN.c7]) });
  playRaw(g, ID);
  return g;
}

/** Accept and pay with `card`, then answer "add up to 1" with the most when it is asked. */
function payAndAdd(g: ReturnType<typeof played>, card: string = SCN.c2) {
  need(g, 'optional', 'p1');
  yes(g);
  payHand(g, [card]);
  if (kind(g) === 'optional') yes(g);
  else if (kind(g) === 'choose')
    g.act({ type: 'pick', choice: { option: optionChoicesOf(g)[0]! } });
}

describe('OP12-119 Bartholomew Kuma: [On Play] may trash 1: add up to 1 deck card to Life, then +2 cost', () => {
  it('paying: the card is trashed, the top deck card goes on top of my Life face-down', () => {
    const g = played();
    payAndAdd(g);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(lifeCards(g)[0]).toBe(SCN.c6);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(g.life('p1')).toBe(5);
    expect(deck(g)[0]).toBe(SCN.c7);
    expect(deck(g)).toHaveLength(11);
    expect(atMain(g)).toBe(true);
  });

  it('then Kuma gains +2 cost (6 -> 8), power unchanged', () => {
    const g = played();
    payAndAdd(g);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(7000);
  });

  it('"you may": declining pays nothing, adds no Life and gives no cost bonus', () => {
    const g = played();
    need(g, 'optional', 'p1');
    no(g);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(g.life('p1')).toBe(4);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(6);
    expect(atMain(g)).toBe(true);
  });

  it('with an empty hand the cost cannot be paid and there is no bonus', () => {
    const g = played([]);
    unusable(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(6);
  });

  it('"Then" is a plain sequence: choosing to add no card to Life still gives the +2 cost (the cost was paid)', () => {
    const g = played();
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SCN.c2]);
    if (kind(g) === 'optional') no(g);
    else if (kind(g) === 'choose')
      g.act({ type: 'pick', choice: { option: optionChoicesOf(g).at(-1)! } });
    expect(g.life('p1')).toBe(4);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });

  it('the +2 lasts through the opponent turn and is gone after the opponent End Phase', () => {
    const g = played();
    payAndAdd(g);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(6);
  });

  it('only one card is added to Life (not more) and the trash is exactly 1 card', () => {
    const g = played([SCN.c2, SCN.c3]);
    payAndAdd(g, SCN.c3);
    expect(g.life('p1')).toBe(5);
    expect(trash(g)).toEqual([SCN.c3]);
    expect(hand(g)).toEqual([SCN.c2]);
  });
});

describe("OP12-119 Bartholomew Kuma: [Opponent's Turn] [On K.O.] add up to 1 deck card to the top of Life", () => {
  function koed() {
    const g = theirs(
      LDR.neutral,
      { characters: [{ card: ID, rested: true } as never], deck: topDeck([SCN.c3, SCN.c4]) },
      { characters: [SCN.c8] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c8), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    return g;
  }

  it('K.O.d on the opponent turn: accepting adds the top deck card to the top of my Life', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    yes(g);
    expect(lifeCards(g)[0]).toBe(SCN.c3);
    expect(g.life('p1')).toBe(5);
    expect(deck(g)[0]).toBe(SCN.c4);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": declining adds nothing', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    no(g);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(12);
  });

  it('a rested Kuma that survives the attack (7000 vs 5000) adds nothing', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [{ card: ID, rested: true } as never], deck: topDeck([SCN.c3]) },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(4);
  });

  it('an opposing K.O. effect (OP11-018 Honesty Impact: -4000, then K.O. 6000 or less) also fires it', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [ID], deck: topDeck([SCN.c3, SCN.c4]) },
      { hand: ['OP11-018'] },
    );
    playRaw(g, 'OP11-018');
    need(g, 'choose', 'p2');
    pickCards(g, [ID]);
    need(g, 'choose', 'p2');
    pickCards(g, [ID]);
    need(g, 'optional', 'p1');
    yes(g);
    expect(lifeCards(g)[0]).toBe(SCN.c3);
    expect(trash(g)).toEqual([ID]);
  });
});

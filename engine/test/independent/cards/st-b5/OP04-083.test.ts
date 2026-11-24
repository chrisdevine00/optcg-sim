/**
 * OP04-083 Sabo (Character, Black, cost 5, 6000, Counter +1000, {Revolutionary Army}/{Dressrosa}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] None of your Characters can be K.O.'d by effects until the start of
 * your next turn. Then, draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: "by effects" does not stop a battle K.O. (RL-14); "until the start of your next turn" ends
 * at step 6-2-1 of my next Refresh Phase, so it covers the whole of my opponent's turn (RL-10, QA-OP06
 * OP06-074); "None of your Characters" is mine, not the opponent's; a Character that cannot be
 * K.O.'d by effects cannot be K.O.'d as a cost either (RL-16); "draw 2 and trash 2" are exact.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  BLUE,
  blockers,
  deck,
  hand,
  kind,
  kw,
  KO_SRC,
  mine,
  need,
  pickCards,
  pickInst,
  playCardRaw,
  squardKo,
  SL,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-stb5a.ts';

const ID = 'OP04-083';
const HAJ = 'OP01-018'; // Red, 6000
const MARCO = 'OP01-023'; // Red, 5000
const SAI = 'OP01-012'; // Red, 4000
const THATCH = 'OP02-007'; // Red, 8000
const LOLA = 'OP06-094'; // Black, cost 4, 6000, {Thriller Bark Pirates}, vanilla
const HOLLOW = 'EB05-049'; // Black Event, cost 1: "You may K.O. 1 of your {Thriller Bark Pirates} Characters: ..."
const DECK = ['OP01-010', 'OP01-043', ...Array(10).fill(BLUE)];

describe('OP04-083 Sabo: [Blocker]', () => {
  it('has [Blocker] and can block', () => {
    const g = theirs(SL.luffy, { characters: [ID] }, { characters: [THATCH] });
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', THATCH), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});

describe("OP04-083 Sabo: [On Play] none of my Characters can be K.O.'d by effects until the start of my next turn", () => {
  it("protects every Character on my field at that moment, Sabo included, against the opponent's K.O. effect", () => {
    const g = mine(
      SL.luffy,
      {
        hand: [ID, SAI, MARCO],
        characters: [HAJ],
        deck: DECK,
        costArea: { active: 10, rested: 0 },
      },
      { hand: [KO_SRC.squard], characters: [KO_SRC.accino], costArea: { active: 10, rested: 0 } },
    );
    playCardRaw(g, ID);
    pickCards(g, [SAI, MARCO]);
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    squardKo(g, g.find('p1', 'characters', HAJ));
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([HAJ, ID].sort());
    expect(trash(g)).toEqual([SAI, MARCO].sort());
    expect(trash(g, 'p1')).not.toContain(HAJ);
  });

  it('Sabo itself is covered', () => {
    const g = mine(
      SL.luffy,
      { hand: [ID, SAI, MARCO], deck: DECK, costArea: { active: 10, rested: 0 } },
      { hand: [KO_SRC.squard], characters: [KO_SRC.accino], costArea: { active: 10, rested: 0 } },
    );
    playCardRaw(g, ID);
    pickCards(g, [SAI, MARCO]);
    act(g, { type: 'endTurn' });
    squardKo(g, g.find('p1', 'characters', ID));
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('it is "by effects" only: a K.O. in battle still happens', () => {
    const g = mine(
      SL.luffy,
      {
        hand: [ID, SAI, MARCO],
        characters: [{ card: HAJ, rested: true }],
        deck: DECK,
        costArea: { active: 10, rested: 0 },
      },
      { characters: [THATCH] },
    );
    playCardRaw(g, ID);
    pickCards(g, [SAI, MARCO]);
    act(g, { type: 'endTurn' });
    attack(g, g.find('p2', 'characters', THATCH), g.find('p1', 'characters', HAJ));
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it("lasts through the opponent's whole turn and ends at the start of my next turn: later K.O. effects work", () => {
    const g = mine(
      SL.luffy,
      {
        hand: [ID, SAI, MARCO],
        characters: [HAJ],
        deck: DECK,
        costArea: { active: 10, rested: 0 },
      },
      {
        hand: [KO_SRC.squard, KO_SRC.squard],
        characters: [KO_SRC.accino, KO_SRC.accino],
        costArea: { active: 10, rested: 0 },
      },
    );
    playCardRaw(g, ID);
    pickCards(g, [SAI, MARCO]);
    act(g, { type: 'endTurn' });
    squardKo(g, g.find('p1', 'characters', HAJ));
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(HAJ);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    // p2's next turn: Sabo's protection ended at my Refresh Phase.
    expect(kind(g)).toBe('main');
    squardKo(g, g.find('p1', 'characters', HAJ));
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(HAJ);
  });

  it("covers only my Characters: after Sabo, my own K.O. effect still removes the opponent's Character", () => {
    const g = mine(
      SL.luffy,
      {
        hand: [ID, SAI, MARCO, KO_SRC.squard],
        characters: [KO_SRC.accino],
        deck: DECK,
        costArea: { active: 10, rested: 0 },
      },
      { characters: [THATCH] },
    );
    playCardRaw(g, ID);
    pickCards(g, [SAI, MARCO]);
    expect(atMain(g)).toBe(true);
    squardKo(g, g.find('p2', 'characters', THATCH));
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it("a protected Character cannot be K.O.d as a cost either (RL-16): Special Hollow's cost cannot be paid", () => {
    const g = mine(
      SL.luffy,
      {
        hand: [ID, HOLLOW, SAI, MARCO],
        characters: [LOLA],
        deck: DECK,
        costArea: { active: 10, rested: 0 },
      },
      { characters: [THATCH] },
    );
    playCardRaw(g, ID);
    pickCards(g, [SAI, MARCO]);
    playCardRaw(g, HOLLOW);
    // RL-16 recommends offering the cost and letting it fail; either encoding must end the same way:
    // Lola stays on the field and the -3 cost is not given.
    if (kind(g) === 'optional') {
      if (g.legal().some((a) => a.type === 'optional' && a.accept)) {
        yes(g, 'p1');
        if (kind(g) === 'choose') pickInst(g, [g.find('p1', 'characters', LOLA)]);
        if (kind(g) === 'choose') pickInst(g, [g.find('p2', 'characters', THATCH)]);
      } else unusable(g, 'p1');
    }
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, LOLA].sort());
    expect(g.card(g.find('p2', 'characters', THATCH)).cost).toBe(6);
  });

  it('control: without Sabo the same Special Hollow cost can be paid', () => {
    const g = mine(
      SL.luffy,
      { hand: [HOLLOW], characters: [LOLA], deck: DECK, costArea: { active: 10, rested: 0 } },
      { characters: [THATCH] },
    );
    playCardRaw(g, HOLLOW);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(LOLA);
  });
});

describe('OP04-083 Sabo: then draw 2 cards and trash 2 cards from my hand', () => {
  it('draws the top 2 cards, then trashes exactly 2 hand cards of my choice', () => {
    const g = mine(SL.luffy, {
      hand: [ID, SAI, MARCO],
      deck: DECK,
      costArea: { active: 10, rested: 0 },
    });
    playCardRaw(g, ID);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    expect(hand(g)).toEqual([SAI, MARCO, 'OP01-010', 'OP01-043'].sort());
    pickCards(g, [MARCO, 'OP01-010']);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([MARCO, 'OP01-010'].sort());
    expect(hand(g)).toEqual([SAI, 'OP01-043'].sort());
    expect(deck(g)).toHaveLength(DECK.length - 2);
  });

  it('with an empty hand otherwise, the 2 drawn cards must both be trashed', () => {
    const g = mine(SL.luffy, { hand: [ID], deck: DECK, costArea: { active: 10, rested: 0 } });
    playCardRaw(g, ID);
    if (kind(g) === 'choose') pickCards(g, ['OP01-010', 'OP01-043']);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual(['OP01-010', 'OP01-043'].sort());
  });
});

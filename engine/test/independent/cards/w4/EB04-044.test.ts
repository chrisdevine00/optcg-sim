/**
 * EB04-044 Koby (Character, black, cost 6, 7000, Counter +1000, {Navy}/{SWORD}).
 *
 * Card text: "[Once Per Turn] If your Leader's type includes "Navy" and this Character would be removed
 * from the field, you may trash 1 card from your hand instead.
 * [Your Turn] [Once Per Turn] When your opponent's Character is K.O.'d, draw 1 card."
 *
 * Rules: a replacement effect is applied instead of the event; the optional cost is paid from the
 * hand (RL-31). Whether an unqualified "removed from the field" also covers a battle K.O. is open
 * (M6b-Q5), so the replacement is exercised with an opponent's K.O. effect, which every reading
 * covers. A card trashed as a replacement is not a K.O. [Your Turn] limits the draw to my own turn;
 * "opponent's Character" means p2's Character from p1's point of view, for any cause.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  chars,
  chr,
  choose,
  accept,
  deck,
  fill,
  hand,
  mine,
  need,
  no,
  noDefence,
  opponentKingdomCome,
  payDon,
  payHandCard,
  playRaw,
  passBlock,
  theirs,
  trash,
  unusable,
  W,
  LW,
  yes,
  BLUE,
} from './kit-w4b.ts';

const KOBY = 'EB04-044';

/** p2's turn: p1 has Koby (and `others`), `handCards`, `life` Life; p2 holds Kingdom Come (and `extra`). */
function theirBoard(
  o: {
    leader?: string;
    handCards?: string[];
    others?: string[];
    extra?: string[];
    life?: number;
    restedKoby?: boolean;
    attackers?: string[];
  } = {},
) {
  return theirs(
    o.leader ?? LW.sakazuki,
    {
      hand: o.handCards ?? [W.marco, W.sai],
      characters: [o.restedKoby ? { card: KOBY, rested: true } : KOBY, ...(o.others ?? [])],
      life: fill(BLUE, o.life ?? 4),
    },
    { hand: [W.kingdomCome, ...(o.extra ?? [])], characters: o.attackers ?? [] },
  );
}

describe('EB04-044 Koby: replacement, trash 1 card from hand instead of being removed', () => {
  it("K.O.'d by an opposing effect with a {Navy} Leader: the replacement is offered; using it trashes a hand card and Koby stays", () => {
    const g = theirBoard();
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    payHandCard(g, g.find('p1', 'hand', W.marco));
    expect(chars(g)).toEqual([KOBY]);
    expect(trash(g)).toEqual([W.marco]);
    expect(hand(g)).toEqual([W.sai]);
  });

  it('declining the replacement lets the K.O. happen and nothing is trashed from the hand', () => {
    const g = theirBoard();
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KOBY]);
    expect(hand(g)).toEqual([W.marco, W.sai].sort());
  });

  it('a Leader whose type merely includes "Navy" ({Navy}/{SWORD} Koby, OP11-001) also enables it', () => {
    const g = theirBoard({ leader: LW.kobyLeader });
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHandCard(g, g.find('p1', 'hand', W.marco));
    expect(chars(g)).toEqual([KOBY]);
  });

  it('without a "Navy" Leader there is no replacement: Koby is K.O.\'d at once', () => {
    const g = theirBoard({ leader: LW.luffy });
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KOBY]);
    expect(hand(g)).toEqual([W.marco, W.sai].sort());
  });

  it('with an empty hand the cost cannot be paid: the K.O. happens', () => {
    const g = theirBoard({ handCards: [] });
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    unusable(g, 'p1');
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KOBY]);
  });

  it('the trashed card is the one I choose among my hand cards', () => {
    const g = theirBoard({ handCards: [W.marco, W.sai, W.komachiyo] });
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    yes(g, 'p1');
    payHandCard(g, g.find('p1', 'hand', W.komachiyo));
    expect(trash(g)).toEqual([W.komachiyo]);
    expect(hand(g)).toEqual([W.marco, W.sai].sort());
  });

  it('is Once Per Turn: once used, a second removal of Koby in the same turn is not replaced', () => {
    // The second removal is a battle K.O. of the (rested) Koby. Whether a battle K.O. is covered at
    // all is open (M6b-Q5); every reading agrees that after one use no second offer is made and
    // Koby is K.O.'d.
    const g = theirBoard({
      restedKoby: true,
      attackers: [W.oars9],
      handCards: [W.marco, W.sai, W.komachiyo],
    });
    opponentKingdomCome(g, at(g, 'p1', 'characters', KOBY));
    yes(g, 'p1');
    payHandCard(g, g.find('p1', 'hand', W.marco));
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([KOBY]);
    attack(g, at(g, 'p2', 'characters', W.oars9), chr(g, 'p1', KOBY));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KOBY, W.marco].sort());
    expect(hand(g)).toEqual([W.komachiyo, W.sai].sort());
  });

  it("the replacement applies to Koby only: another of my Characters K.O.'d the same way is simply K.O.'d", () => {
    const g = theirBoard({ others: [W.hajrudin] });
    opponentKingdomCome(g, at(g, 'p1', 'characters', W.hajrudin));
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([KOBY]);
    expect(trash(g)).toEqual([W.hajrudin]);
    expect(hand(g)).toEqual([W.marco, W.sai].sort());
  });
});

describe("EB04-044 Koby: [Your Turn] [Once Per Turn] draw 1 when an opponent's Character is K.O.'d", () => {
  /** p1's Main Phase: Koby and Hajrudin ready; p2 has two rested Characters. */
  function myBoard() {
    return mine(
      LW.sakazuki,
      { characters: [KOBY, W.hajrudin], hand: [W.lightning] },
      {
        characters: [{ card: W.sai, rested: true }, { card: W.komachiyo, rested: true }, W.thatch],
      },
    );
  }

  it("an opposing Character K.O.'d in battle on my turn: I draw 1 card", () => {
    const g = myBoard();
    const before = hand(g).length;
    const deckBefore = deck(g).length;
    attack(g, at(g, 'p1', 'characters', W.hajrudin), chr(g, 'p2', W.sai));
    noDefence(g);
    expect(chars(g, 'p2')).not.toContain(W.sai);
    expect(hand(g)).toHaveLength(before + 1);
    expect(deck(g)).toHaveLength(deckBefore - 1);
  });

  it('is Once Per Turn: the second K.O. in the same turn draws nothing more', () => {
    const g = myBoard();
    const before = hand(g).length;
    attack(g, at(g, 'p1', 'characters', W.hajrudin), chr(g, 'p2', W.sai));
    noDefence(g);
    need(g, 'main', 'p1');
    attack(g, at(g, 'p1', 'characters', KOBY), chr(g, 'p2', W.komachiyo));
    noDefence(g);
    expect(chars(g, 'p2')).toEqual([W.thatch]);
    expect(hand(g)).toHaveLength(before + 1);
  });

  it("any cause counts: an opposing Character K.O.'d by my effect also draws 1", () => {
    const g = myBoard();
    const before = hand(g).length;
    playRaw(g, W.lightning);
    accept(g);
    payDon(g, 2);
    choose(g, [chr(g, 'p2', W.sai)]);
    expect(chars(g, 'p2')).not.toContain(W.sai);
    // Lightning left my hand (-1) and Koby drew 1 (+1).
    expect(hand(g)).toHaveLength(before);
  });

  it('a battle in which the defender survives draws nothing', () => {
    const g = mine(
      LW.sakazuki,
      { characters: [KOBY, W.hajrudin] },
      { characters: [{ card: W.thatch, rested: true }] },
    );
    const before = hand(g).length;
    attack(g, at(g, 'p1', 'characters', W.hajrudin), chr(g, 'p2', W.thatch));
    noDefence(g);
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([W.thatch]);
    expect(hand(g)).toHaveLength(before);
  });

  it("only on my turn: my own Character K.O.'d on the opponent's turn draws nothing", () => {
    const g = theirBoard({ others: [W.hajrudin] });
    const before = hand(g).length;
    opponentKingdomCome(g, at(g, 'p1', 'characters', W.hajrudin));
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([KOBY]);
    expect(hand(g)).toHaveLength(before);
  });
});

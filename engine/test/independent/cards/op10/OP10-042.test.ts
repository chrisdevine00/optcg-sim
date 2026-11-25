/**
 * OP10-042 Usopp (Leader, Blue/Black, 5000, 5 Life, {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "All of your "Dressrosa" type Characters with a cost of 2 or more gain +1 cost.
 * [Opponent's Turn] [Once Per Turn] This effect can be activated when your "Dressrosa" type
 * Character is removed from the field by your opponent's effect or K.O.'d. If you have 5 or less
 * cards in your hand, draw 1 card."
 *
 * Rules: a permanent cost bonus on the field Characters (RL-32: the condition "cost of 2 or more" is
 * read with the bonus). The auto effect fires on the opponent's turn only, once per turn, when a
 * {Dressrosa} Character is removed by the opponent's effect or K.O.'d (battle K.O. included). The
 * "If" has no colon: an effect condition, checked when the effect resolves, after the removal is
 * complete (a Character returned to my hand is already in my hand). K.O. is not "trash" (RL-15).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  activateTrigger,
  KINGDOM_COME,
  kind,
  mine,
  need,
  noDefence,
  noDefenceUntilTrigger,
  offeredIds,
  opponentKingdomCome,
  pickInst,
  playRaw,
  theirs,
  V10,
  VAN,
  type Chars,
} from './kit-op10a.ts';

const USOPP = 'OP10-042';
/** OP10-044 Cub: Blue, cost 1, 2000, {Dressrosa}/{The Tontattas}. [On Play] only (inert on the field). */
const CUB1 = 'OP10-044';
/** OP14-048 Shiryu: Blue, cost 8, 10000. [On Play] Return up to 1 of your opponent's Characters to the owner's hand. Then, trash all cards from your hand. */
const SHIRYU = 'OP14-048';

const HAND = (n: number): string[] => Array.from({ length: n }, () => VAN.sai);

describe('OP10-042 Usopp: {Dressrosa} Characters with a cost of 2 or more gain +1 cost', () => {
  it('printed values: Leader power 5000', () => {
    const g = mine(USOPP);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a cost-2 {Dressrosa} Character costs 3, a cost-3 costs 4, a cost-7 costs 8', () => {
    const g = mine(USOPP, { characters: [V10.bellamy2, V10.gilly3, V10.hajrudin7] });
    expect(g.card(at(g, 'p1', 'characters', V10.bellamy2)).cost).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', V10.gilly3)).cost).toBe(4);
    expect(g.card(at(g, 'p1', 'characters', V10.hajrudin7)).cost).toBe(8);
  });

  it('boundary: a cost-1 {Dressrosa} Character stays at cost 1', () => {
    const g = mine(USOPP, { characters: [CUB1] });
    expect(g.card(at(g, 'p1', 'characters', CUB1)).cost).toBe(1);
  });

  it('a Character that is not {Dressrosa} is unchanged', () => {
    const g = mine(USOPP, { characters: [VAN.marco, V10.tashigiNavy] });
    expect(g.card(at(g, 'p1', 'characters', VAN.marco)).cost).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', V10.tashigiNavy)).cost).toBe(5);
  });

  it('a Character of both {Dressrosa} and another type gets +1 once (Sengoku {Navy}/{Dressrosa}, cost 5)', () => {
    const g = mine(USOPP, { characters: [V10.sengoku] });
    expect(g.card(at(g, 'p1', 'characters', V10.sengoku)).cost).toBe(6);
  });

  it('only Characters on the field: a {Dressrosa} card in hand keeps its printed cost', () => {
    const g = mine(USOPP, { hand: [V10.gilly3] });
    expect(g.card(at(g, 'p1', 'hand', V10.gilly3)).cost).toBe(3);
  });

  it("it is not limited to my turn: the cost bonus is still there on the opponent's turn", () => {
    const g = theirs(USOPP, { characters: [V10.bellamy2] });
    expect(g.card(at(g, 'p1', 'characters', V10.bellamy2)).cost).toBe(3);
  });

  it("the opponent's {Dressrosa} Characters get nothing", () => {
    const g = mine(USOPP, {}, { characters: [V10.bellamy2] });
    expect(g.card(at(g, 'p2', 'characters', V10.bellamy2)).cost).toBe(2);
  });
});

describe("OP10-042 Usopp: [Opponent's Turn] [Once Per Turn] a {Dressrosa} Character removed or K.O.'d: if 5 or less in hand, draw 1", () => {
  /** p2's turn: p2's `attackers` swing at my rested Characters; p1 holds `hand` cards. */
  function ambush(mineChars: Chars, hand: string[]) {
    return theirs(
      USOPP,
      { characters: mineChars, hand },
      { characters: [VAN.kingdew, VAN.thatch] },
    );
  }
  const restedOf = (c: string) => ({ card: c, rested: true });

  it("a K.O. in battle on the opponent's turn draws 1 card", () => {
    const g = ambush([restedOf(V10.bellamy2)], HAND(3));
    attack(g, at(g, 'p2', 'characters', VAN.kingdew), at(g, 'p1', 'characters', V10.bellamy2));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
  });

  it("a K.O. by the opponent's effect draws 1 card", () => {
    const g = theirs(
      USOPP,
      { characters: [V10.bellamy2], hand: HAND(3) },
      { hand: [KINGDOM_COME], life: [VAN.marco, VAN.marco, VAN.marco, VAN.marco] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', V10.bellamy2));
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
  });

  it("removal by the opponent's effect other than a K.O. (return to hand) draws 1 card", () => {
    const g = theirs(USOPP, { characters: [V10.bellamy2], hand: HAND(3) }, { hand: [SHIRYU] });
    playRaw(g, SHIRYU);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', V10.bellamy2)]);
    // Bellamy came back to the hand (3 + 1), then the draw (4 + 1).
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(5);
    expect(cardIds(g, 'p1', 'hand')).toContain(V10.bellamy2);
  });

  it('boundary after a K.O.: 5 cards in hand still draws (6 after)', () => {
    const g = ambush([restedOf(V10.bellamy2)], HAND(5));
    attack(g, at(g, 'p2', 'characters', VAN.kingdew), at(g, 'p1', 'characters', V10.bellamy2));
    noDefence(g);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(6);
  });

  it('boundary after a K.O.: 6 cards in hand does not draw', () => {
    const g = ambush([restedOf(V10.bellamy2)], HAND(6));
    attack(g, at(g, 'p2', 'characters', VAN.kingdew), at(g, 'p1', 'characters', V10.bellamy2));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(6);
  });

  it('the check is made once the removal is done: 5 in hand plus the returned Character is 6, no draw', () => {
    const g = theirs(USOPP, { characters: [V10.bellamy2], hand: HAND(5) }, { hand: [SHIRYU] });
    playRaw(g, SHIRYU);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', V10.bellamy2)]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(6);
  });

  it("Once Per Turn: a second {Dressrosa} Character K.O.'d in the same turn does not draw again", () => {
    const g = ambush([restedOf(V10.bellamy2), restedOf(V10.gilly3)], HAND(2));
    attack(g, at(g, 'p2', 'characters', VAN.kingdew), at(g, 'p1', 'characters', V10.bellamy2));
    noDefence(g);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    attack(g, at(g, 'p2', 'characters', VAN.thatch), at(g, 'p1', 'characters', V10.gilly3));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
  });

  it("must not happen: a K.O.'d Character that is not {Dressrosa} draws nothing", () => {
    const g = ambush([restedOf(VAN.marco)], HAND(3));
    attack(g, at(g, 'p2', 'characters', VAN.kingdew), at(g, 'p1', 'characters', VAN.marco));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
  });

  it("must not happen: on my own turn a {Dressrosa} Character K.O.'d in battle draws nothing", () => {
    // p2's top Life card is OP12-104 Sentomaru: "[Trigger] K.O. up to 1 of your opponent's Characters
    // with a cost of 4 or less". It K.O.s my Bellamy (cost 2 + 1) on MY turn.
    const g = mine(
      USOPP,
      { characters: [V10.bellamy2, VAN.marco], hand: HAND(3) },
      { life: ['OP12-104', VAN.sai, VAN.sai, VAN.sai] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p2');
    activateTrigger(g);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', V10.bellamy2)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VAN.marco]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    expect(kind(g)).toBe('main');
  });

  it("official Q&A order: the Leader's draw resolves before the [On Play] of the Character my K.O.'d Franky plays", () => {
    // OP10-090 Franky {Dressrosa}: "[On K.O.] Play up to 1 "Dressrosa" Character with a cost of 3 or
    // less from your trash rested". It plays EB03-048 Rebecca, whose [On Play] looks at my deck.
    const g = theirs(
      USOPP,
      {
        characters: ['OP10-090'],
        hand: HAND(2),
        trash: ['EB03-048'],
        deck: [VAN.thatch, ...HAND(14)],
      },
      { hand: [KINGDOM_COME], life: [VAN.marco, VAN.marco, VAN.marco, VAN.marco] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', 'OP10-090'));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', 'EB03-048')]);
    // Rebecca's [On Play] is now pending: the draw of Usopp has already happened.
    need(g, 'choose', 'p1');
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    expect(cardIds(g, 'p1', 'hand')).toContain(VAN.thatch);
  });

  it("the +1 cost counts for the opponent's cost filters: Sentomaru (cost 4 or less) reaches Gilly (3+1) but not Sengoku (5+1)", () => {
    const g = mine(
      USOPP,
      { characters: [V10.gilly3, V10.sengoku], hand: HAND(3) },
      { life: ['OP12-104', VAN.sai, VAN.sai, VAN.sai] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    need(g, 'choose', 'p2');
    expect(offeredIds(g)).toEqual([V10.gilly3]);
  });

  it("the same K.O. on the opponent's turn would draw (control for the previous test): K.O. by effect during their turn", () => {
    const g = theirs(
      USOPP,
      { characters: [V10.bellamy2], hand: HAND(3) },
      { hand: [KINGDOM_COME], life: [VAN.marco, VAN.marco, VAN.marco, VAN.marco] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', V10.bellamy2));
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
  });
});

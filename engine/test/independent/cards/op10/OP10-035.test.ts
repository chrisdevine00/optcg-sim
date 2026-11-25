/**
 * OP10-035 Brook (Character, Green, cost 3, 5000, no Counter, {Straw Hat Crew}/{ODYSSEY}).
 *
 * Card text: "[On K.O.] Rest up to 1 of your opponent's Leader or Character cards with a cost of 5 or
 * less."
 *
 * Rules: [On K.O.] fires when this Character is K.O.'d, in battle or by an effect, on either turn;
 * a return to the hand or a trash is not a K.O. (RL-15). "Up to 1" may be none. Whether the cost
 * limit also applies to an opposing Leader (a Leader has no cost) is open (OPEN-QUESTIONS M6b-Q48):
 * the tests assert only the Characters, which every reading shares.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  cardIds,
  KINGDOM_COME,
  kind,
  mine,
  need,
  none,
  noDefence,
  noDefenceUntilTrigger,
  offeredIds,
  opponentKingdomCome,
  pickInst,
  playRaw,
  theirs,
  VAN,
} from './kit-op10a.ts';

const BROOK = 'OP10-035';
/** OP14-048 Shiryu: Blue, cost 8. [On Play] Return up to 1 of your opponent's Characters to the owner's hand. Then, trash all cards from your hand. */
const SHIRYU = 'OP14-048';
/** OP12-104 Sentomaru: Yellow, cost 4. "[Trigger] K.O. up to 1 of your opponent's Characters with a cost of 4 or less." */
const SENTOMARU = 'OP12-104';

const isRested = (g: ReturnType<typeof theirs>, who: 'p1' | 'p2', card: string, nth = 0) =>
  g.card(at(g, who, 'characters', card, nth)).rested;

/** p2's turn: p2's Thatch K.O.s my rested Brook in battle; p2 also has `others` (active). */
function koInBattle(others: string[]) {
  const g = theirs(
    'ST01-001',
    { characters: [{ card: BROOK, rested: true }] },
    { characters: [VAN.thatch, ...others] },
  );
  attack(g, at(g, 'p2', 'characters', VAN.thatch), at(g, 'p1', 'characters', BROOK));
  noDefence(g);
  return g;
}

describe('OP10-035 Brook: [On K.O.] rest up to 1 opposing Leader or Character with cost 5 or less', () => {
  it('printed values: cost 3, 5000, no Counter', () => {
    const g = theirs('ST01-001', { hand: [BROOK] });
    const c = g.find('p1', 'hand', BROOK);
    expect(g.card(c).cost).toBe(3);
    expect(g.power(c)).toBe(5000);
    expect(g.card(c).counter ?? null).toBeNull();
  });

  it("K.O.'d in battle on the opponent's turn: I may rest an opposing Character with cost 5 or less", () => {
    const g = koInBattle([VAN.kingdew]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VAN.kingdew)]);
    expect(isRested(g, 'p2', VAN.kingdew)).toBe(true);
    expect(cardIds(g, 'p1', 'trash')).toEqual([BROOK]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: a cost-5 Character is offered, a cost-6 Character is not', () => {
    const g = koInBattle([VAN.kingdew, VAN.thatch]);
    need(g, 'choose', 'p1');
    const offered = offeredIds(g);
    expect(offered).toContain(VAN.kingdew);
    // Thatch (cost 6) is one of two: only the copy that is not Thatch qualifies.
    expect(offered.filter((c) => c === VAN.thatch)).toHaveLength(0);
  });

  it('a cost-3 and a cost-2 Character are offered as well', () => {
    const g = koInBattle([VAN.marco, VAN.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(expect.arrayContaining([VAN.marco, VAN.sai]));
  });

  it('"up to 1": may rest nothing', () => {
    const g = koInBattle([VAN.kingdew]);
    none(g);
    expect(isRested(g, 'p2', VAN.kingdew)).toBe(false);
  });

  it('only 1 card is rested even with several candidates', () => {
    const g = koInBattle([VAN.kingdew, VAN.marco]);
    pickInst(g, [at(g, 'p2', 'characters', VAN.marco)]);
    expect(isRested(g, 'p2', VAN.marco)).toBe(true);
    expect(isRested(g, 'p2', VAN.kingdew)).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('my own Characters are never offered', () => {
    const g = theirs(
      'ST01-001',
      { characters: [{ card: BROOK, rested: true }, VAN.sai] },
      { characters: [VAN.thatch, VAN.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.thatch), at(g, 'p1', 'characters', BROOK));
    noDefence(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(VAN.sai);
  });

  it("K.O.'d by the opponent's effect: it triggers as well", () => {
    const g = theirs(
      'ST01-001',
      { characters: [BROOK] },
      {
        hand: [KINGDOM_COME],
        characters: [VAN.kingdew],
        life: [VAN.marco, VAN.marco, VAN.marco, VAN.marco],
      },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', BROOK));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VAN.kingdew)]);
    expect(isRested(g, 'p2', VAN.kingdew)).toBe(true);
  });

  it("K.O.'d on my own turn (by an opposing [Trigger]): it triggers on my turn too", () => {
    const g = mine(
      'ST01-001',
      { characters: [BROOK] },
      { life: [SENTOMARU, VAN.sai, VAN.sai, VAN.sai], characters: [VAN.kingdew] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p2');
    activateTrigger(g);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', BROOK)]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VAN.kingdew)]);
    expect(isRested(g as unknown as ReturnType<typeof theirs>, 'p2', VAN.kingdew)).toBe(true);
  });

  it('must not happen: returned to the hand (not a K.O.) triggers nothing', () => {
    const g = theirs(
      'ST01-001',
      { characters: [BROOK] },
      { hand: [SHIRYU], characters: [VAN.kingdew] },
    );
    playRaw(g, SHIRYU);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', BROOK)]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'hand')).toEqual([BROOK]);
    expect(isRested(g, 'p2', VAN.kingdew)).toBe(false);
  });

  it('must not happen: a Brook that survives a battle does not trigger', () => {
    const g = theirs(
      'ST01-001',
      { characters: [{ card: BROOK, rested: true }] },
      { characters: ['OP02-014', VAN.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-014'), at(g, 'p1', 'characters', BROOK));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([BROOK]);
    expect(isRested(g, 'p2', VAN.kingdew)).toBe(false);
  });
});

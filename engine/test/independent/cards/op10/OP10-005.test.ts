/**
 * OP10-005 Sanji (Character, Red, cost 3, 3000, Counter +1000, {Straw Hat Crew}/{Punk Hazard}).
 *
 * Card text: "[Your Turn] This Character gains +3000 power. [On K.O.] Draw 1 card."
 *
 * Rules: [Your Turn] is a static bonus on my turn only (RL-13: given DON!! also add power on my turn
 * only). [On K.O.] fires on any K.O., in battle or by an effect, on either turn; a bounce or a trash
 * is not a K.O. (RL-15). The draw is mandatory and exactly 1.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  KINGDOM_COME,
  kind,
  mine,
  need,
  noDefence,
  noDefenceUntilTrigger,
  activateTrigger,
  opponentKingdomCome,
  pickInst,
  playRaw,
  theirs,
  VAN,
} from './kit-op10a.ts';

const SANJI = 'OP10-005';
/** OP14-048 Shiryu: Blue, cost 8. [On Play] Return up to 1 of your opponent's Characters to the owner's hand. Then, trash all cards from your hand. */
const SHIRYU = 'OP14-048';

describe('OP10-005 Sanji: [Your Turn] +3000 power; [On K.O.] draw 1', () => {
  it('printed values: cost 3, Counter +1000; 6000 power on my turn', () => {
    const g = mine('ST01-001', { characters: [SANJI] });
    const s = at(g, 'p1', 'characters', SANJI);
    expect(g.card(s).cost).toBe(3);
    expect(g.card(s).counter).toBe(1000);
    expect(g.power(s)).toBe(6000);
  });

  it("on the opponent's turn the +3000 is not there: 3000 power", () => {
    const g = theirs('ST01-001', { characters: [SANJI] });
    expect(g.power(at(g, 'p1', 'characters', SANJI))).toBe(3000);
  });

  it('a given DON!! adds +1000 on my turn only: 7000 on my turn', () => {
    const g = mine('ST01-001', {
      costArea: { active: 9, rested: 0 },
      characters: [{ card: SANJI, don: 1 }],
    });
    expect(g.power(at(g, 'p1', 'characters', SANJI))).toBe(7000);
  });

  it('boundary in battle on my turn: 6000 K.O.s a rested 6000 Character, but not a 7000 one', () => {
    const g = mine(
      'ST01-001',
      { characters: [SANJI] },
      {
        characters: [
          { card: VAN.hajrudin, rested: true },
          { card: VAN.kingdew, rested: true },
        ],
      },
    );
    attack(g, at(g, 'p1', 'characters', SANJI), at(g, 'p2', 'characters', VAN.kingdew));
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toContain(VAN.kingdew);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SANJI]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(0);
  });

  it("[On K.O.]: K.O.'d in battle on the opponent's turn, I draw 1 card", () => {
    const g = theirs(
      'ST01-001',
      { characters: [{ card: SANJI, rested: true }] },
      { characters: [VAN.hajrudin] },
    );
    const deckBefore = g.zone('p1', 'deck').length;
    attack(g, at(g, 'p2', 'characters', VAN.hajrudin), at(g, 'p1', 'characters', SANJI));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([SANJI]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(deckBefore - 1);
  });

  it("[On K.O.]: K.O.'d by the opponent's effect, I draw 1 card", () => {
    const g = theirs(
      'ST01-001',
      { characters: [SANJI] },
      { hand: [KINGDOM_COME], life: [VAN.marco, VAN.marco, VAN.marco, VAN.marco] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', SANJI));
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(1);
  });

  it("[On K.O.] works on my own turn too: K.O.'d by a [Trigger] while I attack, I draw 1", () => {
    // p2's top Life card is OP12-104 Sentomaru: "[Trigger] K.O. up to 1 of your opponent's Characters
    // with a cost of 4 or less".
    const g = mine(
      'ST01-001',
      { characters: [SANJI, VAN.marco] },
      { life: ['OP12-104', VAN.sai, VAN.sai, VAN.sai] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p2');
    activateTrigger(g);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', SANJI)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VAN.marco]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(1);
    expect(kind(g)).toBe('main');
  });

  it("must not happen: returned to the hand by an opponent's effect is not a K.O., so no draw", () => {
    const g = theirs('ST01-001', { characters: [SANJI] }, { hand: [SHIRYU] });
    playRaw(g, SHIRYU);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', SANJI)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([SANJI]);
  });

  it("must not happen: on the opponent's turn a 2000 attacker does not K.O. the 3000 Sanji, so no draw", () => {
    // OP02-014 Whitey Bay: Red, cost 1, 2000, Counter +1000, no DON!! given so no effect.
    const g = theirs(
      'ST01-001',
      { characters: [{ card: SANJI, rested: true }] },
      { characters: ['OP02-014'] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-014'), at(g, 'p1', 'characters', SANJI));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SANJI]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(0);
  });
});

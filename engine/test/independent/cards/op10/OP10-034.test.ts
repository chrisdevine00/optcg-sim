/**
 * OP10-034 Franky (Character, Green, cost 4, 5000, Counter +1000, {Straw Hat Crew}/{ODYSSEY}).
 *
 * Card text: "[Once Per Turn] If this Character would be K.O.'d in battle, you may add 1 card from the
 * top of your Life cards to your hand instead."
 *
 * Rules: a replacement effect (CR 8-1-3-4): optional, once per turn, only for a K.O. in battle (a
 * K.O. by an effect is not replaced); the card added is the top Life card, moved by an effect (no
 * [Trigger] activates, RL-02/rules-digest 104); with no Life card the replacement cannot be applied
 * (RL-31); a replaced K.O. does not happen.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  hand,
  KINGDOM_COME,
  kind,
  need,
  no,
  noDefence,
  opponentKingdomCome,
  theirs,
  VAN,
  yes,
} from './kit-op10a.ts';

const FRANKY = 'OP10-034';
/** OP12-104 Sentomaru: Yellow, cost 4. "[Trigger] K.O. up to 1 of your opponent's Characters with a cost of 4 or less." */
const TRIGGER_CARD = 'OP12-104';

/** p2's turn: my rested Franky is attacked by p2's `attackers`. My Life: `life` (top first). */
function board(
  life: string[] = [VAN.sai, VAN.marco, VAN.komachiyo, VAN.hajrudin],
  attackers = [VAN.thatch, VAN.kingdew],
) {
  return theirs(
    'ST01-001',
    { characters: [{ card: FRANKY, rested: true }], life },
    { characters: attackers, hand: [KINGDOM_COME] },
  );
}

function hitFranky(g: ReturnType<typeof board>, attackerCard: string) {
  attack(g, at(g, 'p2', 'characters', attackerCard), at(g, 'p1', 'characters', FRANKY));
}

describe("OP10-034 Franky: [Once Per Turn] if this would be K.O.'d in battle, you may add the top Life card to your hand instead", () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = theirs('ST01-001', { hand: [FRANKY] });
    const c = g.find('p1', 'hand', FRANKY);
    expect(g.card(c).cost).toBe(4);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(5000);
  });

  it('K.O. in battle: the replacement is offered; accepting adds the top Life card to my hand and Franky stays', () => {
    const g = board();
    hitFranky(g, VAN.thatch);
    noDefence(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([FRANKY]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([VAN.sai]);
    expect(kind(g)).toBe('main');
  });

  it('"may": declining lets Franky be K.O.\'d and the Life is untouched', () => {
    const g = board();
    hitFranky(g, VAN.thatch);
    noDefence(g);
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([FRANKY]);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('it is the TOP Life card that is taken', () => {
    const g = board([VAN.hajrudin, VAN.marco, VAN.sai, VAN.komachiyo]);
    hitFranky(g, VAN.thatch);
    noDefence(g);
    yes(g, 'p1');
    expect(hand(g)).toEqual([VAN.hajrudin]);
    expect(g.zone('p1', 'life')[0]!.card).toBe(VAN.marco);
  });

  it('the Life card added by the effect does not activate its [Trigger]', () => {
    const g = board([TRIGGER_CARD, VAN.marco, VAN.sai, VAN.komachiyo]);
    hitFranky(g, VAN.thatch);
    noDefence(g);
    yes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([TRIGGER_CARD]);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('Once Per Turn: a second K.O. in battle in the same turn is not replaced', () => {
    const g = board();
    hitFranky(g, VAN.thatch);
    noDefence(g);
    yes(g, 'p1');
    hitFranky(g, VAN.kingdew);
    noDefence(g);
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(g.life('p1')).toBe(3);
  });

  it('Once Per Turn is per card: a second Franky has its own use in the same turn', () => {
    const g = theirs(
      'ST01-001',
      {
        characters: [
          { card: FRANKY, rested: true },
          { card: FRANKY, rested: true },
        ],
        life: [VAN.sai, VAN.marco, VAN.komachiyo, VAN.hajrudin],
      },
      { characters: [VAN.thatch, VAN.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.thatch), at(g, 'p1', 'characters', FRANKY, 0));
    noDefence(g);
    yes(g, 'p1');
    attack(g, at(g, 'p2', 'characters', VAN.kingdew), at(g, 'p1', 'characters', FRANKY, 1));
    noDefence(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([FRANKY, FRANKY]);
    expect(g.life('p1')).toBe(2);
  });

  it("a K.O. by an effect is not replaced: no offer, Franky is K.O.'d", () => {
    const g = board();
    opponentKingdomCome(g, at(g, 'p1', 'characters', FRANKY));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([FRANKY]);
  });

  it("boundary: with no Life cards the replacement cannot be used and Franky is K.O.'d", () => {
    const g = board([]);
    hitFranky(g, VAN.thatch);
    noDefence(g);
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('boundary: with exactly 1 Life card it can still be used (the Life goes to 0 without losing)', () => {
    const g = board([VAN.sai]);
    hitFranky(g, VAN.thatch);
    noDefence(g);
    yes(g, 'p1');
    expect(g.life('p1')).toBe(0);
    expect(cardIds(g, 'p1', 'characters')).toEqual([FRANKY]);
    expect(kind(g)).toBe('main');
  });

  it('a survivor of a battle it wins is not affected: a weaker attacker never asks', () => {
    const g = theirs(
      'ST01-001',
      {
        characters: [{ card: FRANKY, rested: true }],
        life: [VAN.sai, VAN.marco, VAN.komachiyo, VAN.hajrudin],
      },
      { characters: ['OP02-014'] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-014'), at(g, 'p1', 'characters', FRANKY));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([FRANKY]);
    expect(g.life('p1')).toBe(4);
  });
});

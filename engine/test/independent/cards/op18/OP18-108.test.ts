/**
 * OP18-108 Funkfreed (Yellow Character, cost 1, 0, Counter +1000, {CP9}).
 *
 * Card text: "[On Play] You may trash 1 card with a type including "CP" from your hand: Draw 2 cards.
 *             [Activate: Main] You may rest this Character: Up to 1 of your [Spandam] gains +1000
 *             power during this turn."
 *
 * Scenery: OP18-105 Spandam (Yellow Character, 1000), CP hand cards OP03-082 Kumadori, OP08-091
 * (Former CP9), non-CP OP02-060 Mohji.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  cardIds,
  decline,
  kind,
  need,
  none,
  offeredIds,
  payHand,
  pickCards,
  play,
  toMyNextMain,
  unusable,
  useAbility,
  yes,
  offeredAbilities,
  LDR,
} from './kit-e.ts';
import { CPHAND, mineE, X } from './kit-e.ts';

const F = 'OP18-108';
const SP = 'OP18-105';
const MISS = 'OP02-060';
const DECK = [MISS, 'OP01-012', 'OP01-023', MISS, MISS, MISS];

function played(hand: string[], p1: object = {}) {
  const g = mineE(LDR.luffy, {
    hand: [F, ...hand],
    deck: DECK,
    costArea: { active: 1, rested: 0 },
    ...p1,
  });
  play(g, at(g, 'p1', 'hand', F));
  return g;
}

describe('OP18-108 Funkfreed: [On Play] you may trash 1 CP card from hand: draw 2 cards', () => {
  it('pay with a CP card: it is trashed and 2 cards are drawn', () => {
    const g = played([X.cp4, MISS]);
    yes(g, 'p1');
    payHand(g, [X.cp4]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([X.cp4]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3); // Mohji + 2 drawn
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(4);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('only a card whose type includes "CP" can pay (Mohji is not offered; "Former CP9" is)', () => {
    const g = played([X.cp4, CPHAND.former, MISS]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([X.cp4, CPHAND.former].sort());
    payHand(g, [CPHAND.former]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([CPHAND.former]);
  });

  it('declining: nothing trashed, nothing drawn', () => {
    const g = played([X.cp4]);
    decline(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([X.cp4]);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('no CP card in hand: the cost cannot be paid and nothing is drawn', () => {
    const g = played([MISS, X.zoro]);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('exactly 2 cards are drawn, not 1 or 3', () => {
    const g = played([X.cp4]);
    yes(g, 'p1');
    payHand(g, [X.cp4]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'hand')).toEqual(DECK.slice(0, 2));
  });
});

describe('OP18-108 Funkfreed: [Activate: Main] rest this Character: up to 1 [Spandam] gains +1000 power during this turn', () => {
  const base = (extra: object = {}) => mineE(LDR.luffy, { characters: [F, SP], ...extra });

  it('rests Funkfreed and gives Spandam +1000 (1000 -> 2000)', () => {
    const g = base();
    const f = at(g, 'p1', 'characters', F);
    useAbility(g, f);
    pickCards(g, [SP]);
    expect(g.card(f).rested).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', SP))).toBe(2000);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('only [Spandam] is a target: other Characters are not offered', () => {
    const g = base({ characters: [F, SP, MISS, 'OP01-012'] });
    useAbility(g, at(g, 'p1', 'characters', F));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP]);
  });

  it('"up to 1": may choose nothing; Funkfreed is still rested (cost paid)', () => {
    const g = base();
    useAbility(g, at(g, 'p1', 'characters', F));
    none(g);
    expect(g.power(at(g, 'p1', 'characters', SP))).toBe(1000);
    expect(g.card(at(g, 'p1', 'characters', F)).rested).toBe(true);
  });

  it('a rested Funkfreed cannot pay the cost: the ability is not offered', () => {
    const g = mineE(LDR.luffy, { characters: [{ card: F, rested: true }, SP] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', F))).toEqual([]);
  });

  it('only +1000 to one Spandam even with two on the field', () => {
    const g = base({ characters: [F, SP, SP] });
    useAbility(g, at(g, 'p1', 'characters', F));
    pickCards(g, [SP]);
    const powers = g
      .zone('p1', 'characters')
      .filter((c) => c.card === SP)
      .map((c) => g.power(c.instance));
    expect(powers.sort()).toEqual([1000, 2000]);
  });

  it('the bonus lasts this turn only', () => {
    const g = base();
    useAbility(g, at(g, 'p1', 'characters', F));
    pickCards(g, [SP]);
    toMyNextMain(g);
    expect(g.power(at(g, 'p1', 'characters', SP))).toBe(1000);
    void kind;
  });
});

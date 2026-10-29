/**
 * OP17-063 Kaido (Character, Purple, cost 10, 12000, no Counter, types Animal Kingdom Pirates / The
 * Four Emperors).
 *
 * Card text (cards/data, no override text patch):
 *   "All Character cards in your hand without a Counter have a +1000 Counter.
 *    [Activate: Main] [Once Per Turn] DON!! −1: If this Character was played on this turn, negate the
 *    effect of up to 1 of your opponent's Characters with a cost of 6 or less during this turn, and
 *    K.O. it."
 *
 * Rules: CR 2-8-2 (Character text works only in the Character area); CR 2-10-4 (only the highest
 * Counter applies, so a card that has a Counter keeps it); CR 2-2-4-2 ("Character card" = outside
 * the Character area, here in hand); CR 7-1-3-1-1 Character Counters; CR 8-2-1-1 (a negated effect
 * does nothing, including a replacement); CR 10-2-13 [Once Per Turn]; CR 8-3-1-6 DON!! −X; CR 4-10-1
 * failed "if". Interactions: OP17-045 Kyo's and EB04-031 King's "instead" replacements.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock } from '../helpers.ts';
import {
  accept,
  AKP,
  activate,
  canActivate,
  canCounterWith,
  choiceCards,
  choices,
  choose,
  chooseNone,
  count,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  payWith,
  PURPLE,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
} from './kit.ts';

function defending(p1: Partial<PlayerSpec>) {
  const g = theirTurn(side(LEAD.shanks, PURPLE, p1), side(LEAD.luffy, RED));
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP17-063 Kaido: Character cards in hand without a Counter have a +1000 Counter', () => {
  it('happy path: EB04-030 Kaido (no Counter) in hand can be used as a +1000 Counter', () => {
    const g = defending({ characters: [AKP.kaido10], hand: [AKP.kaido7] });
    expect(kind(g)).toBe('counter');
    const card = g.find('p1', 'hand', AKP.kaido7);
    expect(canCounterWith(g, card)).toBe(true);
    useCounter(g, card, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.kaido7]);
  });

  it('without OP17-063 on the field, a no-Counter Character card cannot be used as a Counter', () => {
    const g = defending({ hand: [AKP.kaido7] });
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.kaido7))).toBe(false);
  });

  it('CR 2-8-2: OP17-063 in hand grants nothing (neither to itself nor to others)', () => {
    const g = defending({ hand: [AKP.kaido10, AKP.kaido7] });
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.kaido7))).toBe(false);
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.kaido10))).toBe(false);
  });

  it('CR 2-10-4: a card that already has a Counter keeps it (+1000, not +2000)', () => {
    const g = defending({ characters: [AKP.kaido10], hand: [VAN.gordon] });
    useCounter(g, g.find('p1', 'hand', VAN.gordon), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the grant stops 5000 vs 5000 damage: Leader 6000 after the Counter, no Life lost', () => {
    const g = defending({ characters: [AKP.kaido10], hand: [AKP.linlin10] });
    useCounter(g, g.find('p1', 'hand', AKP.linlin10), g.leader('p1'));
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });
});

describe('OP17-063 Kaido: [Activate: Main] [Once Per Turn] DON!! −1 → negate and K.O. (played this turn)', () => {
  function fresh(p2: Partial<PlayerSpec>, p1: Partial<PlayerSpec> = {}) {
    return myTurn(
      side(LEAD.kaido, PURPLE, {
        characters: [{ card: AKP.kaido10, playedThisTurn: true }],
        costArea: { active: 2, rested: 0 },
        ...p1,
      }),
      side(LEAD.luffy, RED, p2),
    );
  }

  it('happy path: DON!! −1 → K.O. an opponent’s Character with cost 6 or less', () => {
    const g = fresh({ characters: [VAN.thatch, VAN.littleOars] });
    activate(g, g.find('p1', 'characters', AKP.kaido10));
    payDon(g, 1, 'costActive');
    expect(donOf(g, 'p1').deck).toBe(9);
    expect(choiceCards(g)).toEqual([VAN.thatch]); // LittleOars Jr. is cost 7
    choose(g, [g.find('p2', 'characters', VAN.thatch)]);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.thatch]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.littleOars]);
  });

  it('CR 8-4-4-1: "up to 1" allows no target; the DON!! −1 is still paid', () => {
    const g = fresh({ characters: [VAN.thatch] });
    activate(g, g.find('p1', 'characters', AKP.kaido10));
    payDon(g, 1, 'costActive');
    chooseNone(g);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.thatch]);
    expect(donOf(g, 'p1').deck).toBe(9);
  });

  it('CR 10-2-13: [Once Per Turn]: not offered again the same turn', () => {
    const g = fresh({ characters: [VAN.thatch, VAN.marco] });
    const kaido = g.find('p1', 'characters', AKP.kaido10);
    activate(g, kaido);
    payDon(g, 1, 'costActive');
    choose(g, [g.find('p2', 'characters', VAN.thatch)]);
    expect(canActivate(g, kaido)).toBe(false);
  });

  it('CR 4-10-1: not played this turn → the K.O. does not happen', () => {
    const g = fresh({ characters: [VAN.thatch] }, { characters: [AKP.kaido10] });
    const kaido = g.find('p1', 'characters', AKP.kaido10);
    if (canActivate(g, kaido)) {
      activate(g, kaido);
      payDon(g, 1, 'costActive');
      const thatch = g.find('p2', 'characters', VAN.thatch);
      if (choices(g).includes(thatch)) choose(g, [thatch]);
    }
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.thatch]);
  });

  it('CR 8-3-1-3: with no DON!! on the field the DON!! −1 cannot be paid', () => {
    const g = fresh({ characters: [VAN.thatch] }, { costArea: { active: 0, rested: 0 } });
    expect(canActivate(g, g.find('p1', 'characters', AKP.kaido10))).toBe(false);
  });

  it('CR 8-2-1-1: the chosen OP17-045 Kyo is negated, so its "trash 2 instead" cannot save it', () => {
    const g = fresh({ characters: [ROCKS.kyo], hand: [VAN.sunny, VAN.sunny] });
    activate(g, g.find('p1', 'characters', AKP.kaido10));
    payDon(g, 1, 'costActive');
    choose(g, [g.find('p2', 'characters', ROCKS.kyo)]);
    expect(offered(g, 'p2')).toBe(false);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([ROCKS.kyo]);
    expect(count(g, 'p2', 'hand')).toBe(2);
  });

  it('only the chosen Character is negated: K.O.ing Marco next to Kyo still lets Kyo’s replacement save it', () => {
    const g = fresh({ characters: [ROCKS.kyo, VAN.marco], hand: [VAN.sunny, VAN.sunny] });
    activate(g, g.find('p1', 'characters', AKP.kaido10));
    payDon(g, 1, 'costActive');
    choose(g, [g.find('p2', 'characters', VAN.marco)]);
    expect(offered(g, 'p2')).toBe(true);
    accept(g);
    payWith(
      g,
      g.zone('p2', 'hand').map((c) => c.instance),
    );
    expect(sortedIds(g, 'p2', 'characters')).toEqual([ROCKS.kyo, VAN.marco].sort());
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.sunny, VAN.sunny]);
  });

  it('CR 8-2-1-1: a negated EB04-031 King cannot use its own "return 1 DON!! instead"', () => {
    const g = fresh({ characters: [AKP.king], costArea: { active: 3, rested: 0 } });
    activate(g, g.find('p1', 'characters', AKP.kaido10));
    payDon(g, 1, 'costActive');
    choose(g, [g.find('p2', 'characters', AKP.king)]);
    expect(offered(g, 'p2')).toBe(false);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([AKP.king]);
    expect(donOf(g, 'p2').active).toBe(3);
  });
});

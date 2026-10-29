/**
 * EB04-030 Kaido (Character, Purple, cost 7, 9000, no Counter, Animal Kingdom Pirates / The Four Emperors).
 *
 * Card text (cards/data, no override text patch):
 *   "If this Character would be K.O.'d, you may return 1 DON!! card from your field to your DON!!
 *    deck instead. [On Play] DON!! −2: If your Leader has the {Animal Kingdom Pirates} type, this
 *    Character gains Rush during this turn. Then, rest up to 1 of your opponent's Characters with a
 *    cost of 7 or less."
 *
 * Rules relied on:
 * - QA-GR / CR 8-1-2: an [On Play] with a cost may be declined (an `optional` decision).
 * - CR 8-3-3 / 4-10-1: text after a failed "if" does not resolve, so with a non-{Animal Kingdom
 *   Pirates} Leader neither the Rush nor the "Then, rest" happens (see the report's ambiguity list).
 * - CR 8-1-3-4 / RL-31: "may … instead" is an optional replacement; K.O. covers battle and effects
 *   (CR 10-2-1-1). RL-23: DON!! −X and replacements may return given DON!! (QA-GR).
 * - CR 10-1-1-1: [Rush] lets it attack the turn it is played.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, canAttack, endTurn, passBlock } from '../helpers.ts';
import {
  AKP,
  accept,
  choiceCards,
  choose,
  chooseNone,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit.ts';

function playKaido(leader: string, p2: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(leader, PURPLE, { hand: [AKP.kaido7], costArea: { active: 7, rested: 0 } }),
    side(LEAD.luffy, RED, { characters: [VAN.littleOars, VAN.shiki8], ...p2 }),
  );
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.kaido7) });
  return g;
}

/** p2's 10000-power attacker (9000 + 1 DON!! on p2's turn) beats a rested EB04-030 (9000). */
function battleKO(p1: Partial<PlayerSpec>) {
  const g = theirTurn(
    side(LEAD.shanks, PURPLE, p1),
    side(LEAD.luffy, RED, { characters: [{ card: VAN.littleOars, don: 1 }] }),
  );
  const kaido = g.find('p1', 'characters', AKP.kaido7);
  attack(g, g.find('p2', 'characters', VAN.littleOars), kaido);
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  return { g, kaido };
}

describe('EB04-030 Kaido: [On Play] DON!! −2: Rush with an AKP Leader, then rest a cost ≤7', () => {
  it('happy path: gains Rush (attacks this turn) and rests a cost-7 Character; DON!! deck +2', () => {
    const g = playKaido(LEAD.kaido);
    const kaido = g.find('p1', 'characters', AKP.kaido7);
    const oars = g.find('p2', 'characters', VAN.littleOars);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 2, 'costRested');
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(g.card(kaido).keywords).toContain('Rush');
    expect(choiceCards(g)).toEqual([VAN.littleOars]);
    choose(g, [oars]);
    expect(g.card(oars).rested).toBe(true);
    expect(canAttack(g, kaido, g.leader('p2'))).toBe(true);
  });

  it('target restriction: a cost-8 Character is not offered; "up to" allows none', () => {
    const g = playKaido(LEAD.kaido);
    accept(g);
    payDon(g, 2, 'costRested');
    expect(choiceCards(g)).not.toContain(VAN.shiki8);
    chooseNone(g);
    expect(g.card(g.find('p2', 'characters', VAN.littleOars)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', AKP.kaido7)).keywords).toContain('Rush');
  });

  it('CR 8-3-3 / 4-10-1: non-AKP Leader → DON!! paid, but no Rush and no rest', () => {
    const g = playKaido(LEAD.shanks);
    const kaido = g.find('p1', 'characters', AKP.kaido7);
    accept(g);
    payDon(g, 2, 'costRested');
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(g.card(kaido).keywords).not.toContain('Rush');
    expect(kind(g)).toBe('main');
    expect(g.card(g.find('p2', 'characters', VAN.littleOars)).rested).toBe(false);
    expect(canAttack(g, kaido, g.leader('p2'))).toBe(false);
  });

  it('QA-GR: the DON!! −2 [On Play] may be declined: no DON!! returned, no Rush, no rest', () => {
    const g = playKaido(LEAD.kaido);
    decline(g);
    expect(donOf(g, 'p1').deck).toBe(3);
    expect(g.card(g.find('p1', 'characters', AKP.kaido7)).keywords).not.toContain('Rush');
    expect(g.card(g.find('p2', 'characters', VAN.littleOars)).rested).toBe(false);
  });

  it('"during this turn": Rush is gone on the next turn', () => {
    const g = playKaido(LEAD.kaido);
    accept(g);
    payDon(g, 2, 'costRested');
    chooseNone(g);
    endTurn(g);
    expect(g.card(g.find('p1', 'characters', AKP.kaido7)).keywords).not.toContain('Rush');
  });
});

describe('EB04-030 Kaido: K.O. replacement (return 1 DON!! instead)', () => {
  it('CR 8-1-3-4: lost battle → optional; returning 1 DON!! keeps Kaido on the field', () => {
    const { g, kaido } = battleKO({
      characters: [{ card: AKP.kaido7, rested: true }],
      costArea: { active: 0, rested: 1 },
    });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'costRested');
    expect(g.card(kaido).zone).toBe('characters');
    expect(donOf(g, 'p1').deck).toBe(10);
  });

  it('RL-31: the replacement is optional; declining lets the K.O. happen', () => {
    const { g } = battleKO({
      characters: [{ card: AKP.kaido7, rested: true }],
      costArea: { active: 0, rested: 1 },
    });
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([AKP.kaido7]);
  });

  it('CR 8-1-3-4-5: with no DON!! on the field the replacement cannot be applied', () => {
    const { g } = battleKO({
      characters: [{ card: AKP.kaido7, rested: true }],
      costArea: { active: 0, rested: 0 },
    });
    expect(offered(g, 'p1')).toBe(false);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([AKP.kaido7]);
  });

  it('RL-23: a DON!! given to Kaido itself counts as "from your field"', () => {
    const { g, kaido } = battleKO({
      characters: [{ card: AKP.kaido7, rested: true, don: 1 }],
      costArea: { active: 0, rested: 0 },
    });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1, 'given', kaido);
    expect(g.card(kaido).zone).toBe('characters');
    expect(g.card(kaido).don).toBe(0);
  });
});

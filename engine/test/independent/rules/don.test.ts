/**
 * Giving DON!! (rules digest §I; CR 6-5-5, 4-4-2).
 * Leader ST01-001 (Red, 5000). OP01-023 Marco: vanilla, 5000 power. OP01-010 Komachiyo: vanilla,
 * 3000 power. Stage OP05-021: [Activate: Main] only.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { act, attack, don, endTurn, FILL, fill, isLegal, L, noDefence, S, V } from '../helpers.ts';

const p2Default = {
  leader: L.purpleKaido,
  life: fill(FILL.purple, 5),
  deck: fill(FILL.purple, 10),
};

describe('giving DON!! (CR 6-5-5)', () => {
  it('CR 6-5-5-1 / 4-4-2: giving moves 1 active cost-area DON!! under the card; given DON!! are neither active nor rested', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        costArea: { active: 2, rested: 1 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: p2Default,
    });
    act(g, { type: 'giveDon', target: g.leader('p1') });
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1')).toEqual({ deck: 7, active: 1, rested: 1, given: 1 });
  });

  it('CR 6-5-5-1: rested DON!! in the cost area cannot be given', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.marco],
        costArea: { active: 0, rested: 3 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: p2Default,
    });
    expect(g.legal().filter((a) => a.type === 'giveDon')).toEqual([]);
  });

  it('CR 6-5-5-1 [open-question Q10]: DON!! can be given only to your Leader or a Character in your Character area', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.marco],
        stage: S.armyHq,
        hand: [V.sai],
        costArea: { active: 1, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { ...p2Default, characters: [{ card: V.dobon, rested: true }] },
    });
    const targets = g
      .legal()
      .flatMap((a) => (a.type === 'giveDon' ? [a.target] : []))
      .sort();
    expect(targets).toEqual([g.leader('p1'), g.find('p1', 'characters', V.marco)].sort());
    expect(isLegal(g, { type: 'giveDon', target: g.find('p1', 'stage', S.armyHq) })).toBe(false);
    expect(isLegal(g, { type: 'giveDon', target: g.find('p1', 'hand', V.sai) })).toBe(false);
    expect(isLegal(g, { type: 'giveDon', target: g.leader('p2') })).toBe(false);
    expect(isLegal(g, { type: 'giveDon', target: g.find('p2', 'characters', V.dobon) })).toBe(
      false,
    );
  });

  it('CR 6-5-5-3: DON!! may be given repeatedly while active DON!! remain', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.marco],
        costArea: { active: 3, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: p2Default,
    });
    const marco = g.find('p1', 'characters', V.marco);
    act(g, { type: 'giveDon', target: g.leader('p1') });
    act(g, { type: 'giveDon', target: g.leader('p1') });
    act(g, { type: 'giveDon', target: marco });
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.card(marco).don).toBe(1);
    expect(g.legal().filter((a) => a.type === 'giveDon')).toEqual([]);
  });

  it('CR 6-5-5-2: each given DON!! adds +1000 power during your own turn', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy, // 5000
        characters: [V.komachiyo], // 3000
        costArea: { active: 3, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: p2Default,
    });
    const komachiyo = g.find('p1', 'characters', V.komachiyo);
    act(g, { type: 'giveDon', target: g.leader('p1') });
    act(g, { type: 'giveDon', target: g.leader('p1') });
    act(g, { type: 'giveDon', target: komachiyo });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(komachiyo)).toBe(4000);
  });

  it('CR 6-5-5-2: given DON!! add no power during the opponent’s turn', () => {
    // p2's Leader (ST04-001, 5000) and OP01-103 Scratchmen Apoo (6000) still hold DON!! given on
    // p2's last turn; it is now p1's turn.
    const g = scenario({
      p1: { leader: L.redLuffy, life: fill(FILL.red, 5), deck: fill(FILL.red, 10) },
      p2: {
        ...p2Default,
        leader: { card: L.purpleKaido, don: 1 },
        characters: [{ card: V.apoo, don: 2 }],
      },
    });
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', V.apoo))).toBe(6000);
  });

  it('CR 6-5-5-2 / 6-2-3: DON!! given on your turn stay through the opponent’s turn without power, and return at your Refresh', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.komachiyo], // 3000
        costArea: { active: 1, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: p2Default,
    });
    const komachiyo = g.find('p1', 'characters', V.komachiyo);
    act(g, { type: 'giveDon', target: komachiyo });
    expect(g.power(komachiyo)).toBe(4000);
    endTurn(g);
    expect(g.card(komachiyo).don).toBe(1);
    expect(g.power(komachiyo)).toBe(3000);
    endTurn(g);
    expect(g.card(komachiyo).don).toBe(0);
    expect(g.power(komachiyo)).toBe(3000);
  });

  it('CR 6-5-5-4: when a card with given DON!! leaves the field, its DON!! go to the cost area rested', () => {
    // OP02-006 Kingdew (7000) attacks p2's rested OP02-080 Dobon (4000), which holds 2 DON!!.
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.kingdew],
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: {
        ...p2Default,
        characters: [{ card: V.dobon, rested: true, don: 2 }],
        costArea: { active: 3, rested: 1 },
        donDeck: 4,
      },
    });
    attack(g, g.find('p1', 'characters', V.kingdew), g.find('p2', 'characters', V.dobon));
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(don(g, 'p2')).toEqual({ deck: 4, active: 3, rested: 3, given: 0 });
  });
});

/** CR 2-7, 3 (areas), 4-4-2 and 6-5-3: zones, card states and playing cards (RL-04..RL-07). */
import { describe, expect, it } from 'vitest';
import { IllegalAction, project, queries, whyNot } from '../../src/index.ts';
import { scenario } from '../fixtures/index.ts';
import {
  EVENT_RED,
  give,
  KAIDO,
  LUFFY,
  op,
  PUR_1,
  RED_1,
  RED_5,
  STAGE_RED,
  times,
  types,
} from '../support/game.ts';

describe('playing cards (CR 6-5-3-1, 2-7-2..2-7-4)', () => {
  it('Character: reveal, rest DON!! equal to its cost, then it enters active (CR 2-7-2, 3-7-5)', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: [RED_5], costArea: { active: 6, rested: 0 } },
      p2: { leader: KAIDO },
    });
    const card = g.find('p1', 'hand', RED_5);
    const ev = g.act({ type: 'playCard', card });
    expect(
      types(ev).filter((t) => ['CardRevealed', 'DonRested', 'CardMoved', 'CardPlayed'].includes(t)),
    ).toEqual(['CardRevealed', 'DonRested', 'CardMoved', 'CardPlayed']);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 1, rested: 5 });
    expect(g.card(card)).toMatchObject({ zone: 'characters', rested: false });
  });

  it('CR 2-7-2: a card whose cost exceeds the active DON!! cannot be played', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: [RED_5], costArea: { active: 4, rested: 2 } },
      p2: { leader: KAIDO },
    });
    const card = g.find('p1', 'hand', RED_5);
    expect(g.isLegal({ type: 'playCard', card, player: 'p1' })).toBe(false);
    expect(whyNot(g.state, 'p1', { type: 'playCard', card })).toMatchObject({ rule: 'CR 2-7-2' });
  });

  it('Stage: pay the cost, then it enters active (CR 2-7-4, 3-8-4)', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: [STAGE_RED], costArea: { active: 1, rested: 0 } },
      p2: { leader: KAIDO },
    });
    const card = g.find('p1', 'hand', STAGE_RED);
    g.act({ type: 'playCard', card });
    expect(g.zone('p1', 'stage')).toEqual([
      expect.objectContaining({ card: STAGE_RED, rested: false }),
    ]);
  });

  it('Event: an unscripted Event cannot be activated (E-D8); whyNot says so', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: [EVENT_RED], costArea: { active: 5, rested: 0 } },
      p2: { leader: KAIDO },
    });
    const card = g.find('p1', 'hand', EVENT_RED);
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
    expect(whyNot(g.state, 'p1', { type: 'playCard', card })!.text).toMatch(/not automated/);
  });

  it('Event: reveal, rest DON!!, trash it, then resolve its [Main] (CR 2-7-3, 8-4-2)', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: [EVENT_RED], costArea: { active: 2, rested: 0 } },
      p2: { leader: KAIDO },
    });
    give(g, EVENT_RED, [
      { id: 'main', kind: 'activate', when: 'main', effect: [{ op: 'emit', label: 'resolved' }] },
    ]);
    const ev = g.act({ type: 'playCard', card: g.find('p1', 'hand', EVENT_RED) });
    const order = types(ev).filter((t) =>
      ['CardRevealed', 'DonRested', 'CardMoved', 'EventActivated', 'EffectResolved'].includes(t),
    );
    expect(order).toEqual([
      'CardRevealed',
      'DonRested',
      'CardMoved',
      'EventActivated',
      'EffectResolved',
    ]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([EVENT_RED]);
  });

  it('a 0-cost card can be played with no DON!! (QA-GR)', () => {
    const g = scenario({ p1: { leader: LUFFY, hand: [EVENT_RED] }, p2: { leader: KAIDO } });
    give(g, EVENT_RED, [{ id: 'main', kind: 'activate', when: 'main', effect: [] }]);
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'cost',
        target: g.find('p1', 'hand', EVENT_RED),
        amount: -2,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    expect(g.card(g.find('p1', 'hand', EVENT_RED)).cost).toBe(0);
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(true);
  });
});

describe('Character and Stage limits', () => {
  it('CR 3-7-6 / 3-7-6-1 / RL-04: a 6th Character: pay, trash 1 by rule (no K.O.), then place; never 6', () => {
    const chars = [RED_1, RED_1, RED_1, RED_1, RED_5];
    const g = scenario({
      p1: { leader: LUFFY, characters: chars, hand: [RED_5], costArea: { active: 5, rested: 0 } },
      p2: { leader: KAIDO },
    });
    give(g, RED_1, [
      { id: 'ko', kind: 'auto', when: ['onKO'], effect: [{ op: 'emit', label: 'onKO' }] },
    ]);
    const card = g.find('p1', 'hand', RED_5);
    const ev1 = g.act({ type: 'playCard', card });
    expect(types(ev1)).toEqual(expect.arrayContaining(['CardRevealed', 'DonRested']));
    expect(queries.decision(g.state)).toMatchObject({
      kind: 'choose',
      player: 'p1',
      min: 1,
      max: 1,
    });
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    const victim = g.find('p1', 'characters', RED_1);
    const ev2 = g.act({ type: 'pick', choice: victim });
    const moved = ev2.find((e) => e.type === 'CardMoved' && e.instance === victim)!;
    expect(moved).toMatchObject({ to: 'trash', cause: { kind: 'rule', by: 'p1' } });
    expect(types(ev2)).not.toContain('KO');
    expect(ev2.some((e) => e.type === 'EffectResolved')).toBe(false); // CR 3-7-6-1-1: no [On K.O.]
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(g.card(card).zone).toBe('characters');
  });

  it('CR 3-7-6-1-1: the rule trash ignores "cannot be K.O.\'d" and K.O. replacements', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        characters: times(5, RED_1),
        hand: [RED_1],
        costArea: { active: 1, rested: 0 },
      },
      p2: { leader: KAIDO },
    });
    const victim = g.zone('p1', 'characters')[0]!.instance;
    op(g, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeKOd',
        target: victim,
        controller: 'p1',
        duration: { kind: 'thisTurn', turn: 3 },
      },
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', RED_1) });
    g.act({
      type: 'pick',
      choice: [...g.zone('p1', 'characters').map((c) => c.instance)].sort()[0]!,
    });
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(g.zone('p1', 'trash')).toHaveLength(1);
  });

  it('CR 3-8-5-1 / RL-07: playing a 2nd Stage pays, trashes the old one by rule, and places the new one active', () => {
    const g = scenario({
      p1: {
        leader: LUFFY,
        stage: { card: STAGE_RED, rested: true },
        hand: [STAGE_RED],
        costArea: { active: 2, rested: 0 },
      },
      p2: { leader: KAIDO },
    });
    const old = g.zone('p1', 'stage')[0]!.instance;
    const card = g.find('p1', 'hand', STAGE_RED);
    const ev = g.act({ type: 'playCard', card });
    const i = types(ev);
    expect(i.indexOf('DonRested')).toBeLessThan(
      ev.findIndex((e) => e.type === 'CardMoved' && e.instance === old),
    );
    expect(ev.find((e) => e.type === 'CardMoved' && e.instance === old)).toMatchObject({
      to: 'trash',
      cause: { kind: 'rule' },
    });
    expect(g.zone('p1', 'stage')).toEqual([
      expect.objectContaining({ instance: card, rested: false }),
    ]);
  });
});

describe('areas', () => {
  it('CR 3-7-4: a played Character cannot attack that turn', () => {
    const g = scenario({
      p1: { leader: LUFFY, hand: [RED_1], costArea: { active: 1, rested: 0 } },
      p2: { leader: KAIDO },
    });
    const card = g.find('p1', 'hand', RED_1);
    g.act({ type: 'playCard', card });
    expect(
      whyNot(g.state, 'p1', { type: 'attack', attacker: card, target: g.leader('p2') }),
    ).toMatchObject({ rule: 'CR 3-7-4' });
  });

  it('CR 3-5-2: trash is public and new cards go on top', () => {
    const g = scenario({
      p1: { leader: LUFFY, trash: [RED_1], characters: [RED_5] },
      p2: { leader: KAIDO },
    });
    op(g, { op: 'trashFromField', card: g.find('p1', 'characters', RED_5), by: 'p2' });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([RED_5, RED_1]);
    const v = project(g.state, 'p2');
    expect(v.zones.p1.trash.map((c) => c.card)).toEqual([RED_5, RED_1]);
  });

  it('CR 3-6-3: the Leader cannot be moved out of the Leader area', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    expect(() => op(g, { op: 'bounce', card: g.leader('p1'), by: 'p2' })).toThrow();
  });

  it('CR 4-4-2: given DON!! are neither active nor rested; only counts by class', () => {
    const g = scenario({
      p1: { leader: { card: LUFFY, don: 2 }, costArea: { active: 1, rested: 3 } },
      p2: { leader: KAIDO },
    });
    expect(queries.don(g.state, 'p1')).toEqual({ deck: 4, active: 1, rested: 3, given: 2 });
    expect(g.zone('p1', 'costArea')).toEqual([]);
  });

  it('CR 1-3-2-1: resting a rested card is not performed', () => {
    const g = scenario({ p1: { leader: { card: LUFFY, rested: true } }, p2: { leader: KAIDO } });
    const ev = op(g, { op: 'rest', card: g.leader('p1') });
    expect(types(ev)).not.toContain('Rested');
  });

  it('a non-decider action throws IllegalAction from reduce', () => {
    const g = scenario({ p1: { leader: LUFFY }, p2: { leader: KAIDO } });
    expect(() => g.act({ type: 'endTurn', player: 'p2' })).toThrow(IllegalAction);
  });
});

describe('summoning sickness and the purple deck', () => {
  it('a Character played last turn can attack (CR 3-7-4 ends with the turn)', () => {
    const g = scenario({
      p1: { leader: LUFFY, characters: [RED_1] },
      p2: { leader: KAIDO, characters: [{ card: PUR_1, rested: true }] },
    });
    const a = g.find('p1', 'characters', RED_1);
    expect(
      g.isLegal({
        type: 'attack',
        attacker: a,
        target: g.find('p2', 'characters', PUR_1),
        player: 'p1',
      }),
    ).toBe(true);
  });
});

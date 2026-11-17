/** OP17-023 Nami. QA-OP17 OP17-023: one rest covers two Characters K.O.'d at once. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { accept, decline, expectDecision, game, pick, play, payDon, KAIDO, V } from './helpers.ts';
import { EAST_BLUE, PLAIN_BLUE, plantOpponentEffect, RGL, SHC6 } from './helpers-rgl-penel.ts';

const koByEffect = (p1: Partial<PlayerSpec>, target: string) => {
  const g = game(
    { leader: RGL, ...p1 },
    { leader: KAIDO, hand: ['OP09-077'], costArea: { active: 4, rested: 0 } },
    { turn: 4, activePlayer: 'p2' },
  );
  play(g, 'OP09-077');
  accept(g);
  payDon(g);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};
const onField = (g: ReturnType<typeof koByEffect>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP17-023 Nami', () => {
  it("rests Nami instead of a {Straw Hat Crew} Character being K.O.'d", () => {
    const g = koByEffect({ characters: ['OP17-023', V.c4, SHC6] }, SHC6);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(onField(g)).toContain(SHC6);
    expect(g.card(g.find('p1', 'characters', 'OP17-023')).rested).toBe(true);
  });

  it('covers an {East Blue} Character too', () => {
    const g = koByEffect({ characters: ['OP17-023', EAST_BLUE] }, EAST_BLUE);
    accept(g);
    expect(onField(g)).toContain(EAST_BLUE);
  });

  it('may be declined', () => {
    const g = koByEffect({ characters: ['OP17-023', SHC6] }, SHC6);
    decline(g);
    expect(onField(g)).not.toContain(SHC6);
    expect(g.card(g.find('p1', 'characters', 'OP17-023')).rested).toBe(false);
  });

  it('does not cover other types', () => {
    const g = koByEffect({ characters: ['OP17-023', V.c4] }, V.c4);
    expectDecision(g, 'main', 'p2');
    expect(onField(g)).not.toContain(V.c4);
  });

  it('Nami can save herself while she is active', () => {
    const g = koByEffect({ characters: ['OP17-023'] }, 'OP17-023');
    accept(g);
    expect(onField(g)).toEqual(['OP17-023']);
    expect(g.card(g.find('p1', 'characters', 'OP17-023')).rested).toBe(true);
  });

  it('cannot be used while Nami is rested', () => {
    const g = koByEffect({ characters: [{ card: 'OP17-023', rested: true }, SHC6] }, SHC6);
    expectDecision(g, 'main', 'p2');
    expect(onField(g)).not.toContain(SHC6);
  });

  it("QA-OP17 OP17-023: one rest saves two Characters K.O.'d at once", () => {
    const g = game(
      { leader: RGL, characters: ['OP17-023', SHC6, EAST_BLUE] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    // "K.O. all of your opponent's Characters", planted on the opponent's Leader.
    plantOpponentEffect(g, { ko: { from: 'characters', owner: 'opponent' } });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(onField(g).sort()).toEqual(['OP17-023', SHC6, EAST_BLUE].sort());
    expect(g.card(g.find('p1', 'characters', 'OP17-023')).rested).toBe(true);
    expectDecision(g, 'main', 'p2');
  });

  it('also applies to a battle K.O.', () => {
    const g = game(
      { leader: RGL, characters: ['OP17-023', { card: SHC6, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', SHC6),
    });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(onField(g)).toContain(SHC6);
  });
});

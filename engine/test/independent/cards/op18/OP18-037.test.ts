/**
 * OP18-037 Yokozuna (Green Character, cost 4, 2000, {Animal}/{Water Seven}).
 *
 * Card text (cards/data):
 *   "[Blocker]
 *    [On K.O.] Rest up to 1 of your opponent's cards."
 *
 * Reading (m6b-audit Q16): Blocker; when K.O.'d, rest up to 1 of the opponent's cards: Leader,
 * Characters, Stage, or an active DON!! card of their cost area (as OP14-024 Kin'emon).
 *
 * Scenery: OP02-007 Thatch (8000 attacker, rested by attacking), OP01-023 Marco (active target),
 * OP03-020 Striker (Stage).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers } from '../../helpers.ts';
import { at, atMain, donOf, endBattle, kw, LC, need, none, pickInst, theirs, VC } from './kit-c.ts';

const YOKO = 'OP18-037';
const STAGE = 'OP03-020';

/** p2's Thatch (8000) K.O.'s p1's rested Yokozuna (2000); p2 also has an active Marco and a Stage. */
function ko(p2: Parameters<typeof theirs>[2] = {}) {
  const g = theirs(
    LC.luffy,
    { characters: [{ card: YOKO, rested: true }] },
    { characters: [VC.thatch6, VC.marco3], stage: STAGE, ...p2 },
  );
  attack(g, at(g, 'p2', 'characters', VC.thatch6), at(g, 'p1', 'characters', YOKO));
  endBattle(g);
  return g;
}

describe('OP18-037 Yokozuna: [Blocker] and [On K.O.] rest up to 1 of the opponent’s cards', () => {
  it('has Blocker and can block', () => {
    const g = theirs(LC.luffy, { characters: [YOKO] }, { characters: [VC.marco3] });
    expect(kw(g, at(g, 'p1', 'characters', YOKO))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', VC.marco3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', YOKO)]);
  });

  it('can rest an opposing Character', () => {
    const g = ko();
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VC.marco3)]);
    expect(g.card(at(g, 'p2', 'characters', VC.marco3)).rested).toBe(true);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('can rest the opposing Leader', () => {
    const g = ko();
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('can rest the opposing Stage', () => {
    const g = ko();
    pickInst(g, [at(g, 'p2', 'stage', STAGE)]);
    expect(g.card(at(g, 'p2', 'stage', STAGE)).rested).toBe(true);
  });

  it('can rest one of the opponent’s active DON!! cards', () => {
    const g = ko();
    need(g, 'choose', 'p1');
    const before = donOf(g, 'p2');
    act(g, { type: 'pick', choice: { from: 'costActive' } });
    const after = donOf(g, 'p2');
    expect(after.active).toBe(before.active - 1);
    expect(after.rested).toBe(before.rested + 1);
  });

  it('"up to 1": may rest nothing', () => {
    const g = ko();
    none(g);
    expect(g.card(at(g, 'p2', 'characters', VC.marco3)).rested).toBe(false);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('only one card is rested (picking one ends the choice)', () => {
    const g = ko();
    pickInst(g, [at(g, 'p2', 'characters', VC.marco3)]);
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.card(at(g, 'p2', 'stage', STAGE)).rested).toBe(false);
  });

  it('your own cards are never offered', () => {
    const g = ko();
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).not.toContain(g.leader('p1'));
  });
});

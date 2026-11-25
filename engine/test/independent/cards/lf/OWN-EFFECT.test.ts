/**
 * LF-R3: "your opponent's effect" is not "any effect". The blind groups only ever removed the
 * protected Character with an OPPONENT's effect, so a script that read `effect` for
 * `opponentEffect` (or the reverse) passed. Each case here removes the Character with a planted
 * effect of its OWN controller (the engine's `ko` op with `by` the owner, or a planted
 * [Activate: Main] on the owner's Leader; no scripted card can K.O. or rest your own Character
 * without a cost the cards do not have) and expects the printed result:
 *
 * - EB03-018, OP09-086, OP10-070, OP11-046, OP12-024: "by your opponent's effects" does not stop
 *   your own K.O. effect (and OP11-046's rest protection does not stop your own rest effect).
 * - OP12-027, ST22-012: the replacement watches the opponent's effect only, so your own K.O.
 *   effect is not replaced and nothing is offered.
 * - OP09-033: "by effects" (no "opponent's") does stop your own K.O. effect.
 */
import { describe, expect, it } from 'vitest';
import type { InstanceId } from '@optcg/engine';
import { withAbilities, applyOp, type Ability } from '../../../../src/testing.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { act } from '../../helpers.ts';
import {
  at,
  chars,
  hand,
  isRested,
  kind,
  LD_LF,
  mine,
  playRaw,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const { marco, sai, lucci, frankyShc, flampe1000, mohji } = VAN_LF;

/** An effect of the Character's own controller (p1) K.O.s `card`; the engine op, no prompt. */
function koOwn(g: TestGame, card: InstanceId): void {
  g.state = applyOp(g.state, { op: 'ko', card, by: 'p1' }).state;
}

/** p1's own planted [Activate: Main] on the Leader: `action` (an effect action of p1's). */
function plantOwn(g: TestGame, action: Record<string, unknown>): void {
  const leader = g.leader('p1');
  g.state = withAbilities(g.state, g.card(leader).card, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: action }],
    } as unknown as Ability,
  ]);
  act(g, { type: 'activate', card: leader, ability: 'planted' });
}

describe("LF-R3: opponent-effect protections do not stop the owner's own effects", () => {
  it("EB03-018 Tashigi: on the opponent's turn my own K.O. effect K.O.s her", () => {
    const g = theirs(LD_LF.luffy, { characters: ['EB03-018'] });
    koOwn(g, at(g, 'p1', 'characters', 'EB03-018'));
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual(['EB03-018']);
  });

  it('OP09-086 Burgess: my own K.O. effect K.O.s him', () => {
    const g = mine(LD_LF.teach, { characters: ['OP09-086'] });
    koOwn(g, at(g, 'p1', 'characters', 'OP09-086'));
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual(['OP09-086']);
  });

  it('OP10-070 Trebol: after the [On Play], my own K.O. effect K.O.s a 1000-power Character', () => {
    const g = mine(LD_LF.croc, { hand: ['OP10-070'], characters: [flampe1000] });
    playRaw(g, 'OP10-070');
    koOwn(g, at(g, 'p1', 'characters', flampe1000));
    expect(chars(g)).not.toContain(flampe1000);
    expect(trash(g)).toContain(flampe1000);
  });

  it('OP11-046 Yonji: my own K.O. effect K.O.s him and my own rest effect rests him', () => {
    const g = mine(LD_LF.croc, { characters: ['OP11-046'] });
    koOwn(g, at(g, 'p1', 'characters', 'OP11-046'));
    expect(chars(g)).toEqual([]);
    const h = mine(LD_LF.croc, { characters: ['OP11-046'] });
    const y = at(h, 'p1', 'characters', 'OP11-046');
    plantOwn(h, { rest: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    if (kind(h) === 'choose') act(h, { type: 'pick', choice: y });
    expect(isRested(h, y)).toBe(true);
  });

  it('OP12-024 Gyukimaru: active, my own K.O. effect K.O.s him', () => {
    const g = mine(LD_LF.luffy, { characters: ['OP12-024'] });
    koOwn(g, at(g, 'p1', 'characters', 'OP12-024'));
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual(['OP12-024']);
  });

  it('OP12-027 Koushirou: my own K.O. effect on a <Slash> Character is not replaced and offers nothing', () => {
    const g = mine(LD_LF.luffy, { characters: ['OP12-027', sai] });
    koOwn(g, at(g, 'p1', 'characters', sai));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual(['OP12-027']);
    expect(trash(g)).toEqual([sai]);
    expect(isRested(g, at(g, 'p1', 'characters', 'OP12-027'))).toBe(false);
  });

  it('ST22-012 Marco: my own K.O. effect K.O.s him; no prompt, my hand stays', () => {
    const g = mine(LD_LF.luffy, { characters: ['ST22-012'], hand: [mohji, marco] });
    koOwn(g, at(g, 'p1', 'characters', 'ST22-012'));
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual(['ST22-012']);
    expect(hand(g).sort()).toEqual([mohji, marco].sort());
  });

  it('OP09-033 Robin ("by effects", not "by your opponent\'s effects"): my own K.O. effect cannot K.O. my protected Character', () => {
    const g = mine(LD_LF.luffy, {
      hand: ['OP09-033'],
      characters: [{ card: marco, rested: true }, { card: sai, rested: true }, lucci, frankyShc],
      costArea: { active: 10, rested: 0 },
    });
    playRaw(g, 'OP09-033');
    koOwn(g, at(g, 'p1', 'characters', lucci));
    expect(chars(g)).toContain(lucci);
    // A Character of another type is K.O.'d by the same effect.
    koOwn(g, at(g, 'p1', 'characters', marco));
    expect(chars(g)).not.toContain(marco);
  });
});

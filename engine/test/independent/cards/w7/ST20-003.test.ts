/**
 * ST20-003 Charlotte Brulee (Character, Yellow, cost 3, 3000, Counter +2000, <Special>, {Big Mom
 * Pirates}).
 *
 * Card text: "[Trigger] Look at up to 1 card from the top of your or your opponent's Life cards, and
 * place it at the top or bottom of the Life cards. Then, add this card to your hand."
 *
 * Rules used: the [Trigger] is activated by the player whose Life card it was (CR 10-1-5); the
 * Life card taken by the damage is already out of Life when the effect resolves; "up to 1" may be
 * none; a look is private to the looker (the opponent learns nothing about the card, only that a
 * look happened); the card goes back into the same player's Life; "Then, add this card to your
 * hand" has no "If", so it happens after any choice, including none; declining the [Trigger] adds
 * the card to the hand with no effect (CR 10-1-5-2).
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { act, attack, cardIds, decision } from '../../helpers.ts';
import { kind, optionChoices } from '../kit.ts';
import { need, now, S7, theirs7 } from './kit-w7b.ts';

const BRULEE = 'ST20-003';
const A = S7.marco; // OP01-023
const B = S7.sai; // OP01-012
const C = S7.komachiyo; // OP01-010
const D = S7.hajrudin; // OP01-018
const E = S7.kingdew; // OP02-006

/** p2 hits p1's Leader; p1's top Life card is Brulee. Stops at the [Trigger] decision. */
function hit(p1Life: string[] = [BRULEE, A, B], p2Life: string[] = [C, D, E]) {
  const g = theirs7(S7.slashSupernova, { life: p1Life }, { life: p2Life });
  attack(g, g.leader('p2'), g.leader('p1'));
  act(g, { type: 'block', blocker: null });
  act(g, { type: 'endCounter' });
  need(g, 'trigger', 'p1');
  return g;
}

/** Activate the [Trigger], choose whose Life (`you`, `opponent` or `none`), then the end if it is asked. */
function run(
  g: ReturnType<typeof hit>,
  whose: 'you' | 'opponent' | 'none',
  end: 'top' | 'bottom' = 'top',
) {
  act(g, { type: 'trigger', activate: true });
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: { option: whose } });
  if (kind(g) === 'choose' && optionChoices(g).includes(end))
    act(g, { type: 'pick', choice: { option: end } });
}

describe("ST20-003 Charlotte Brulee: [Trigger] look at up to 1 card from the top of your or your opponent's Life, place it at the top or bottom; then add this card to my hand", () => {
  it('printed values: cost 3, 3000 power, Counter +2000', () => {
    const g = theirs7(S7.slashSupernova, { hand: [BRULEE] });
    const b = g.card(g.find('p1', 'hand', BRULEE));
    expect(b.cost).toBe(3);
    expect(b.power).toBe(3000);
    expect(b.counter).toBe(2000);
  });

  it('the Life card taken by the hit is Brulee, and the question is the [Trigger] (activate or add to hand)', () => {
    const g = hit();
    expect(g.legal().filter((a) => a.type === 'trigger').length).toBe(2);
  });

  it('my Life, bottom: the top card moves to the bottom of my Life; Brulee goes to my hand', () => {
    const g = hit();
    run(g, 'you', 'bottom');
    expect(cardIds(g, 'p1', 'life')).toEqual([B, A]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BRULEE]);
    expect(cardIds(g, 'p2', 'life')).toEqual([C, D, E]);
  });

  it('my Life, top: the order is unchanged', () => {
    const g = hit();
    run(g, 'you', 'top');
    expect(cardIds(g, 'p1', 'life')).toEqual([A, B]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BRULEE]);
  });

  it("the opponent's Life, bottom: their top card goes to the bottom of THEIR Life; mine is untouched", () => {
    const g = hit();
    run(g, 'opponent', 'bottom');
    expect(cardIds(g, 'p2', 'life')).toEqual([D, E, C]);
    expect(cardIds(g, 'p1', 'life')).toEqual([A, B]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BRULEE]);
  });

  it("the opponent's Life, top: their order is unchanged", () => {
    const g = hit();
    run(g, 'opponent', 'top');
    expect(cardIds(g, 'p2', 'life')).toEqual([C, D, E]);
  });

  it('"up to 1": choosing none changes no Life area, and Brulee is still added to my hand', () => {
    const g = hit();
    run(g, 'none');
    expect(cardIds(g, 'p1', 'life')).toEqual([A, B]);
    expect(cardIds(g, 'p2', 'life')).toEqual([C, D, E]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BRULEE]);
    expect(kind(g)).toBe('main');
  });

  it('the Life counts never change (a look and a placement is not a removal)', () => {
    const g = hit();
    run(g, 'opponent', 'bottom');
    expect(cardIds(g, 'p1', 'life').length).toBe(2);
    expect(cardIds(g, 'p2', 'life').length).toBe(3);
    expect(g.eventsOfType('LifeRemoved').length).toBeLessThanOrEqual(1); // only the damage itself
  });

  it('declining the [Trigger]: Brulee is added to my hand with no look and no question', () => {
    const g = hit();
    act(g, { type: 'trigger', activate: false });
    expect(cardIds(g, 'p1', 'hand')).toEqual([BRULEE]);
    expect(cardIds(g, 'p1', 'life')).toEqual([A, B]);
    expect(decision(g)?.player).toBe('p2');
    expect(kind(g)).toBe('main');
  });

  it('whose Life: only players that have Life cards are offered; with no Life left for me, "you" is not an option', () => {
    const g = hit([BRULEE], [C, D]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(optionChoices(g)).not.toContain('you');
    expect(optionChoices(g)).toContain('opponent');
    expect(optionChoices(g)).toContain('none');
  });

  it('whose Life: the opponent with no Life cards is not an option', () => {
    const g = hit([BRULEE, A, B], []);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(optionChoices(g)).not.toContain('opponent');
    expect(optionChoices(g)).toContain('you');
  });

  it("hidden information: the opponent's view names none of my Life cards after I looked at theirs", () => {
    const g = hit();
    run(g, 'opponent', 'bottom');
    const v = project(g.state, 'p2');
    expect(v.zones.p1.life.every((c) => c.card === null)).toBe(true);
    expect(kind(g), now(g)).toBe('main');
  });
});

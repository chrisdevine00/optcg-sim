/**
 * OP13-105 Kouzuki Momonosuke (Character, Yellow, cost 3, 0 power, Counter +1000, {Land of Wano}
 * {Kouzuki Clan}).
 *
 * Card text: "[On Play] Look at all of your Life cards and place them back in your Life area in any
 * order."
 *
 * Rules used: the Life cards stay in Life (a look and a re-order is not a removal: no Life card goes
 * to the hand, no [Trigger]); the controller chooses the whole order; the opponent learns nothing
 * about the cards (rules digest 108, M6b-Q81: the face state is kept is the engine's reading, the
 * tests only assert the face-down ones).
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { act, cardIds, decision } from '../../helpers.ts';
import { outcomes } from '../kit.ts';
import { kind, mine7, now, S7 } from './kit-w7b.ts';

const MOMO = 'OP13-105';
const A = S7.marco; // OP01-023
const B = S7.sai; // OP01-012
const C = S7.komachiyo; // OP01-010
const D = S7.hajrudin; // OP01-018

const lifeKey = (g: ReturnType<typeof mine7>) => cardIds(g, 'p1', 'life').join('>');

/** All orders reachable by the choices p1 owes after playing Momonosuke. */
function reachable(life: string[]): Set<string> {
  const g = mine7(S7.slashSupernova, { hand: [MOMO], life });
  act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMO) });
  return outcomes(g, 'p1', lifeKey);
}

describe('OP13-105 Kouzuki Momonosuke: [On Play] look at all my Life cards and place them back in any order', () => {
  it('printed values: cost 3, power 0, Counter +1000', () => {
    const g = mine7(S7.slashSupernova, { hand: [MOMO] });
    const m = g.zone('p1', 'hand')[0]!;
    const c = g.card(m.instance);
    expect(c.cost).toBe(3);
    expect(c.power).toBe(0);
    expect(c.counter).toBe(1000);
  });

  it('with 3 Life cards every one of the 6 orders can be chosen', () => {
    const sets = reachable([A, B, C]);
    expect([...sets].sort()).toEqual(
      [
        [A, B, C],
        [A, C, B],
        [B, A, C],
        [B, C, A],
        [C, A, B],
        [C, B, A],
      ]
        .map((x) => x.join('>'))
        .sort(),
    );
  });

  it('with 4 Life cards all 24 orders are reachable', () => {
    expect(reachable([A, B, C, D]).size).toBe(24);
  });

  it('with 2 Life cards both orders are reachable', () => {
    expect([...reachable([A, B])].sort()).toEqual([`${A}>${B}`, `${B}>${A}`].sort());
  });

  it("the choice is the player's: the first card picked is the new top card and the rest follow in the order picked", () => {
    const g = mine7(S7.slashSupernova, { hand: [MOMO], life: [A, B, C] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMO) });
    // Pick C first, then B, so the new order is C, B, A (A is the one left).
    for (const want of [C, B]) {
      expect(kind(g), now(g)).toBe('order');
      const a = g.legal().find((x) => x.type === 'order' && g.card(x.first).card === want);
      expect(a, `no order action for ${want}`).toBeDefined();
      g.act(a!);
    }
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'life')).toEqual([C, B, A]);
  });

  it('the number of Life cards is unchanged and none goes to the hand; the Character is on the field', () => {
    const g = mine7(S7.slashSupernova, { hand: [MOMO], life: [A, B, C] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMO) });
    for (let i = 0; i < 6 && kind(g) === 'order'; i++)
      g.act(g.legal().find((x) => x.type === 'order')!);
    expect(cardIds(g, 'p1', 'life').sort()).toEqual([A, B, C].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([MOMO]);
    expect(g.eventsOfType('LifeRemoved').length).toBe(0);
  });

  it('with 1 Life card: nothing to order, the Life card is where it was', () => {
    const g = mine7(S7.slashSupernova, { hand: [MOMO], life: [A] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMO) });
    for (let i = 0; i < 3 && kind(g) === 'order'; i++)
      g.act(g.legal().find((x) => x.type === 'order')!);
    expect(kind(g), now(g)).toBe('main');
    expect(cardIds(g, 'p1', 'life')).toEqual([A]);
  });

  it('with no Life cards: the [On Play] does nothing and the game goes on', () => {
    const g = mine7(S7.slashSupernova, { hand: [MOMO], life: [] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMO) });
    expect(kind(g), now(g)).toBe('main');
    expect(cardIds(g, 'p1', 'life')).toEqual([]);
  });

  it("the opponent's Life is untouched and the opponent owes no decision", () => {
    const g = mine7(S7.slashSupernova, { hand: [MOMO], life: [A, B, C] }, { life: [D, C, B] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMO) });
    while (decision(g)?.kind === 'order') {
      expect(decision(g)!.player).toBe('p1');
      g.act(g.legal().find((x) => x.type === 'order')!);
    }
    expect(cardIds(g, 'p2', 'life')).toEqual([D, C, B]);
  });

  it("hidden information: the opponent's view names none of my Life cards, during the choice or after it", () => {
    const g = mine7(S7.slashSupernova, { hand: [MOMO], life: [A, B, C] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', MOMO) });
    const named = (v: ReturnType<typeof project>) => v.zones.p1.life.map((c) => c.card);
    expect(named(project(g.state, 'p2')).every((c) => c === null)).toBe(true);
    while (decision(g)?.kind === 'order') g.act(g.legal().find((x) => x.type === 'order')!);
    expect(named(project(g.state, 'p2')).every((c) => c === null)).toBe(true);
  });
});

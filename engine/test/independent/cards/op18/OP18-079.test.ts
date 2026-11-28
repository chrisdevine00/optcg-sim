/**
 * OP18-079 Spandam (Leader, Black/Yellow, 5000, 4 Life, {CP9}).
 *
 * Card text (cards/data):
 *   "[Activate: Main] You may rest 2 of your DON!! cards and this Leader and trash 1 card with a
 *    type including "CP" from your hand: Add up to 1 card from the top of your deck to the top of
 *    your Life cards."
 *
 * Rules: all cost parts must be payable (CR 8-3-1): 2 active DON!!, an active Leader, a card in hand
 * with a type including "CP". The Life card goes on top (CR 8-3, Life area top). "Up to 1": may add
 * none, the cost stays paid. No once-per-turn text: the rested Leader is what limits it.
 *
 * Scenery: OP03-082 Kumadori ({CP9}, Black, cost 4) and OP03-087 Nero ({CP9}, cost 3) are the CP
 * cards; OP01-012 Sai is a non-CP Character; OP09-077 Gum-Gum Lightning is an Event.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  canActivate,
  cardIds,
  donOf,
  mine,
  need,
  offeredAbilities,
  toMyNextMain,
  VAN,
  choiceCards,
} from './kit-d.ts';

const SPANDAM = 'OP18-079';
const CP_A = 'OP03-082';
const CP_B = 'OP03-087';
const TOP = 'OP01-010';
const NEXT = 'OP01-012';

function game(p1: Partial<PlayerSpec> = {}): TestGame {
  return mine(SPANDAM, {
    hand: [CP_A, VAN.sai],
    deck: [TOP, NEXT, ...Array.from({ length: 12 }, () => VAN.marco)],
    life: Array.from({ length: 4 }, () => VAN.hajrudin),
    costArea: { active: 5, rested: 0 },
    ...p1,
  });
}

function start(g: TestGame) {
  act(g, {
    type: 'activate',
    card: g.leader('p1'),
    ability: offeredAbilities(g, g.leader('p1'))[0]!,
  });
}

/** Pay the cost by trashing `cp` from hand (the DON!! and the Leader are rested without a question). */
function payCost(g: TestGame, cp: string = CP_A) {
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('cost');
  act(g, { type: 'pick', choice: g.find('p1', 'hand', cp) });
}

/** Answer the "add the top card of your deck to your Life?" question. */
function addTop(g: TestGame, yes: boolean) {
  need(g, 'optional', 'p1');
  act(g, { type: 'optional', accept: yes });
}

describe('OP18-079 Spandam: [Activate: Main] rest 2 DON!! + this Leader + trash a CP card: top of deck to top of Life', () => {
  it('pays the cost (2 DON!! rested, Leader rested, CP card trashed) and adds the deck top to the top of Life', () => {
    const g = game();
    start(g);
    payCost(g);
    // Any remaining question is the "up to 1" pick or count; accept 1.
    addTop(g, true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(cardIds(g, 'p1', 'trash')).toEqual([CP_A]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(g.life('p1')).toBe(5);
    expect(cardIds(g, 'p1', 'life')[0]).toBe(TOP);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(NEXT);
  });

  it('only cards with a type including "CP" can pay: Sai (no CP type) and an Event are not offered', () => {
    const g = game({ hand: [CP_A, VAN.sai, 'OP09-077', CP_B] });
    start(g);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect(choiceCards(g)).toEqual([CP_A, CP_B].sort());
  });

  it('with no CP card in hand it cannot be activated', () => {
    const g = game({ hand: [VAN.sai, 'OP09-077'] });
    expect(canActivate(g, g.leader('p1'))).toBe(false);
  });

  it('with fewer than 2 active DON!! (a third DON!! rested does not help) it cannot be activated', () => {
    const g = game({ costArea: { active: 1, rested: 4 } });
    expect(canActivate(g, g.leader('p1'))).toBe(false);
  });

  it('with the Leader already rested it cannot be activated (and is available again next turn)', () => {
    const g = game();
    expect(canActivate(g, g.leader('p1'))).toBe(true);
    start(g);
    payCost(g);
    addTop(g, true);
    expect(canActivate(g, g.leader('p1'))).toBe(false);
    toMyNextMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('"up to 1": adding no card is allowed, the cost stays paid and Life stays at 4', () => {
    const g = game();
    start(g);
    payCost(g);
    addTop(g, false);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'trash')).toEqual([CP_A]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(TOP);
  });

  it('the Life card goes on top: it is the first one taken as damage', () => {
    const g = game();
    start(g);
    payCost(g);
    addTop(g, true);
    expect(g.zone('p1', 'life')[0]!.card).toBe(TOP);
    expect(
      g
        .zone('p1', 'life')
        .slice(1)
        .every((c) => c.card === VAN.hajrudin),
    ).toBe(true);
  });
});

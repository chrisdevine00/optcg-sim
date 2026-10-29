/**
 * OP17-074 Yamato (Character, Purple, cost 3, 1000, Counter +1000, [Blocker], type Land of Wano).
 *
 * Card text (cards/data, override keywords ["Blocker"]):
 *   "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 *    target of the attack.)
 *    [On Play] Add up to 1 DON!! card as rested from your DON!! deck."
 *
 * Rules: CR 10-1-4-1 [Blocker]; CR 2-8-4 (parenthesised reminder text has no effect); the [On Play]
 * has no Leader condition; CR 2-7-2 (a rested DON!! cannot pay a cost); "up to 1" with an empty
 * DON!! deck does nothing (CR 1-3-2).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, isLegal, passCounter } from '../helpers.ts';
import {
  accept,
  AKP,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  PURPLE,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function game(p1: Partial<PlayerSpec>, leader: string = LEAD.kaido) {
  return myTurn(
    side(leader, PURPLE, { hand: [AKP.yamato], costArea: { active: 3, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED),
  );
}

function playYamato(g: TestGame): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.yamato) });
  if (offered(g, 'p1')) accept(g); // "up to 1" asked as a yes/no
}

describe('OP17-074 Yamato: [Blocker]', () => {
  it('CR 10-1-4-1: Yamato blocks, becomes the target, and is K.O.’d by the 5000 Leader', () => {
    const g = theirTurn(
      side(LEAD.shanks, PURPLE, { characters: [AKP.yamato] }),
      side(LEAD.luffy, RED),
    );
    const yamato = g.find('p1', 'characters', AKP.yamato);
    expect(g.card(yamato).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([yamato]);
    act(g, { type: 'block', blocker: yamato });
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([AKP.yamato]);
  });
});

describe('OP17-074 Yamato: [On Play] add up to 1 DON!! as rested', () => {
  it('happy path: DON!! deck −1, one more rested DON!! in the cost area', () => {
    const g = game({});
    playYamato(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
    expect(kind(g)).toBe('main');
  });

  it('no Leader condition: it works under ST05-001 Shanks too', () => {
    const g = game({}, LEAD.shanks);
    playYamato(g);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 4, deck: 6 });
  });

  it('CR 2-7-2: the added DON!! is rested, so it cannot pay for a 1-cost Character this turn', () => {
    const g = game({ hand: [AKP.yamato, VAN.gordon] });
    playYamato(g);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', VAN.gordon) })).toBe(false);
  });

  it('CR 1-3-2: with an empty DON!! deck nothing is added and the play still completes', () => {
    const g = game({ costArea: { active: 10, rested: 0 } });
    playYamato(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, rested: 3, deck: 0 });
    expect(kind(g)).toBe('main');
  });
});

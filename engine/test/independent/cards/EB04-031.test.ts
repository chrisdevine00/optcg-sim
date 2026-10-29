/**
 * EB04-031 King (Character, Purple, cost 6, 7000, no Counter, Animal Kingdom Pirates / Lunarian).
 *
 * Card text (cards/data, no override text patch):
 *   "If this Character would be K.O.'d, you may return 1 DON!! card from your field to your DON!!
 *    deck instead. [Activate: Main] [Once Per Turn] If your Leader has the {Animal Kingdom Pirates}
 *    type and you have no other [King] Characters, add up to 1 DON!! card from your DON!! deck and
 *    set it as active, and add up to 1 additional DON!! card and rest it."
 *
 * Rules relied on:
 * - CR 10-2-13: [Once Per Turn]. CR 8-3-3: a failed "if" means nothing resolves. An "if" in the
 *   effect text is not an activation cost, so the engine may either refuse the activation or let it
 *   resolve to nothing; the tests accept both and check that no DON!! moves.
 * - CR 2-1-2 / 2-2-4-1: "[King] Characters" means Characters named exactly King in the Character
 *   area; a Leader named King is not a Character.
 * - CR 1-3-2: "up to" adds as many as the DON!! deck holds.
 * - RL-31 / CR 8-1-3-4: the K.O. replacement is optional ("may … instead").
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, passBlock } from '../helpers.ts';
import {
  AKP,
  accept,
  activate,
  canActivate,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  settleYes,
  side,
  theirTurn,
  VAN,
} from './kit.ts';

function game(p1: Partial<PlayerSpec>) {
  return myTurn(
    side(LEAD.kaido, PURPLE, { costArea: { active: 0, rested: 3 }, characters: [AKP.king], ...p1 }),
    side(LEAD.luffy, RED),
  );
}

/** Activate if the engine lets us, resolving every choice; returns whether it was offered. */
function tryActivate(g: ReturnType<typeof game>, card: string): boolean {
  if (!canActivate(g, card)) return false;
  activate(g, card);
  settleYes(g, 'p1');
  return true;
}

describe('EB04-031 King: [Activate: Main] [Once Per Turn] add 1 active and 1 rested DON!!', () => {
  it('happy path: DON!! deck −2, cost area +1 active and +1 rested', () => {
    const g = game({});
    const king = g.find('p1', 'characters', AKP.king);
    expect(canActivate(g, king)).toBe(true);
    activate(g, king);
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4, deck: 5 });
    expect(kind(g)).toBe('main');
  });

  it('CR 10-2-13: [Once Per Turn]: not offered a second time this turn', () => {
    const g = game({});
    const king = g.find('p1', 'characters', AKP.king);
    activate(g, king);
    settleYes(g, 'p1');
    expect(canActivate(g, king)).toBe(false);
  });

  it('CR 3-7-4 only limits attacks: a King played this turn may activate', () => {
    const g = game({ characters: [{ card: AKP.king, playedThisTurn: true }] });
    expect(canActivate(g, g.find('p1', 'characters', AKP.king))).toBe(true);
  });

  it('condition: another [King] Character on the field → no DON!! added', () => {
    // ST04-004 King: a Character named King, placed (its [On Play] does not run).
    const g = game({ characters: [AKP.king, 'ST04-004'] });
    tryActivate(g, g.find('p1', 'characters', AKP.king));
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('condition: two EB04-031 Kings each see an "other" King → neither adds DON!!', () => {
    const g = game({ characters: [AKP.king, AKP.king] });
    tryActivate(g, g.find('p1', 'characters', AKP.king, 0));
    tryActivate(g, g.find('p1', 'characters', AKP.king, 1));
    expect(donOf(g, 'p1').deck).toBe(7);
  });

  it('CR 2-2-4-1: a Leader named King (OP01-091, AKP) is not a "[King] Character" → it works', () => {
    const g = game({ leader: 'OP01-091' });
    activate(g, g.find('p1', 'characters', AKP.king));
    settleYes(g, 'p1');
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('condition: non-{Animal Kingdom Pirates} Leader → no DON!! added', () => {
    const g = game({ leader: LEAD.shanks });
    tryActivate(g, g.find('p1', 'characters', AKP.king));
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('CR 1-3-2: with 1 DON!! in the DON!! deck, only the active one is added', () => {
    const g = game({ costArea: { active: 0, rested: 9 } });
    activate(g, g.find('p1', 'characters', AKP.king));
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 9, deck: 0 });
  });

  it('with an empty DON!! deck nothing is added', () => {
    const g = game({ costArea: { active: 0, rested: 10 } });
    tryActivate(g, g.find('p1', 'characters', AKP.king));
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 10, deck: 0 });
  });
});

describe('EB04-031 King: K.O. replacement', () => {
  function battle(p1: Partial<PlayerSpec>) {
    // p2's OP02-007 Thatch (8000) attacks rested King (7000) and wins.
    const g = theirTurn(
      side(LEAD.shanks, PURPLE, { characters: [{ card: AKP.king, rested: true }], ...p1 }),
      side(LEAD.luffy, RED, { characters: [VAN.thatch] }),
    );
    const king = g.find('p1', 'characters', AKP.king);
    attack(g, g.find('p2', 'characters', VAN.thatch), king);
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    return { g, king };
  }

  it('CR 8-1-3-4: lost battle → optional; return 1 DON!! and King stays', () => {
    const { g, king } = battle({ costArea: { active: 1, rested: 0 } });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1);
    expect(g.card(king).zone).toBe('characters');
    expect(donOf(g, 'p1').deck).toBe(10);
  });

  it('RL-31: declining lets the K.O. happen', () => {
    const { g } = battle({ costArea: { active: 1, rested: 0 } });
    decline(g);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([AKP.king]);
  });

  it('CR 8-1-3-4-5: no DON!! on the field → no replacement offered', () => {
    const { g } = battle({ costArea: { active: 0, rested: 0 } });
    expect(offered(g, 'p1')).toBe(false);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([AKP.king]);
  });
});

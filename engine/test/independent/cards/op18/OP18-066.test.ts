/**
 * OP18-066 Zambai (Character, Purple, cost 5, 6000, Counter +1000, {Water Seven}/{The Franky Family}).
 *
 * Card text (cards/data):
 *   "[Activate: Main] You may K.O. 1 of your Stages with a cost of 5 or less: This Character gains
 *    [Rush] during this turn.
 *    (This card can attack on the turn in which it is played.)"
 *
 * Rules: the K.O. is a cost paid by the activating player (CR 8-3-1); a cost that cannot be paid
 * means the ability cannot be activated (CR 8-3-1-3). Only the player's own Stage counts ("1 of
 * your Stages"), with a cost of 5 or less (inclusive). [Rush] lets a Character attack the turn it
 * is played (CR 10-1-1) and lasts "during this turn". There is no [Once Per Turn].
 *
 * Scenery Stages: OP05-040 Birdcage (cost 5), OP06-041 The Ark Noah (cost 6), OP03-075 Galley-La
 * Company (cost 3), OP03-020 Striker (cost 1).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import {
  atMain,
  canActivate,
  canAttackAnything,
  canHit,
  CH,
  cardIds,
  kind,
  LDR,
  mine,
  offeredAbilities,
  playCard,
  side,
  STG,
  toMyNextMain,
  myTurn,
  BLUE,
  RED,
  type Chars,
} from './kit-ga.ts';
import type { PlayerSpec } from '@optcg/engine';

const ZAMBAI = 'OP18-066';

/** p1's Main Phase with Zambai (played this turn unless `fresh` is false) and the given Stage. */
function board(stage?: string, fresh = true, p1: Partial<PlayerSpec> = {}) {
  const chars: Chars = [{ card: ZAMBAI, playedThisTurn: fresh }];
  return mine(LDR.luffy, { characters: chars, ...(stage ? { stage } : {}), ...p1 });
}

function use(g: ReturnType<typeof board>) {
  const z = g.find('p1', 'characters', ZAMBAI);
  const [ability] = offeredAbilities(g, z);
  act(g, { type: 'activate', card: z, ability: ability! });
  return z;
}

describe('OP18-066 Zambai: [Activate: Main] K.O. 1 of your Stages (cost 5 or less): gains [Rush] this turn', () => {
  it('happy path: Zambai played this turn cannot attack; after K.O.ing a Stage it can attack the Leader', () => {
    const g = board(STG.galley);
    const z = g.find('p1', 'characters', ZAMBAI);
    expect(canAttackAnything(g, z)).toBe(false);
    expect(g.card(z).keywords).not.toContain('Rush');
    use(g);
    expect(g.card(z).keywords).toContain('Rush');
    expect(canHit(g, z, g.leader('p2'))).toBe(true);
    expect(cardIds(g, 'p1', 'stage')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([STG.galley]);
  });

  it('the Rush attack really works: it hits for 1 Life', () => {
    const g = board(STG.striker);
    const z = use(g);
    attack(g, z, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('cost boundary: a Stage with cost exactly 5 (Birdcage) can be K.O.’d', () => {
    const g = board(STG.birdcage);
    expect(canActivate(g, g.find('p1', 'characters', ZAMBAI))).toBe(true);
    use(g);
    expect(cardIds(g, 'p1', 'stage')).toEqual([]);
  });

  it('cost boundary: a Stage with cost 6 (The Ark Noah) cannot pay the cost: not activatable', () => {
    const g = board(STG.ark);
    expect(canActivate(g, g.find('p1', 'characters', ZAMBAI))).toBe(false);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.ark]);
  });

  it('CR 8-3-1-3: with no Stage at all the cost cannot be paid: not activatable', () => {
    const g = board();
    expect(canActivate(g, g.find('p1', 'characters', ZAMBAI))).toBe(false);
  });

  it('"your Stages": the opponent’s Stage cannot be K.O.’d for the cost', () => {
    const g = myTurn(
      side(LDR.luffy, BLUE, { characters: [{ card: ZAMBAI, playedThisTurn: true }] }),
      side(LDR.kid, RED, { stage: STG.galley }),
    );
    expect(canActivate(g, g.find('p1', 'characters', ZAMBAI))).toBe(false);
  });

  it('"during this turn": the Rush is gone on the next turn (the keyword is not kept)', () => {
    const g = board(STG.galley);
    const z = use(g);
    toMyNextMain(g);
    expect(g.card(z).keywords).not.toContain('Rush');
  });

  it('no [Once Per Turn]: with a new Stage in place it can be activated again in the same turn', () => {
    // The first Stage is used; a second Stage is then played from hand by p1 (cost 1 Striker).
    const g = board(STG.galley, true, { hand: [STG.striker] });
    use(g);
    expect(canActivate(g, g.find('p1', 'characters', ZAMBAI))).toBe(false);
    playCard(g, STG.striker);
    expect(canActivate(g, g.find('p1', 'characters', ZAMBAI))).toBe(true);
  });

  it('the K.O. is not conditional on Zambai being new: a Zambai that can already attack still gets Rush', () => {
    const g = board(STG.galley, false);
    const z = use(g);
    expect(g.card(z).keywords).toContain('Rush');
    expect(atMain(g)).toBe(true);
    expect(kind(g)).toBe('main');
  });

  it('CR 2-8-2: Zambai in hand has no [Activate: Main] on the field', () => {
    const g = mine(LDR.luffy, { hand: [ZAMBAI], stage: STG.galley });
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });

  it('Rush is only for the Zambai that paid: another Character played this turn still cannot attack', () => {
    const g = mine(LDR.luffy, {
      characters: [
        { card: ZAMBAI, playedThisTurn: true },
        { card: CH.kingdew5, playedThisTurn: true },
      ],
      stage: STG.galley,
    });
    use(g);
    expect(canAttackAnything(g, g.find('p1', 'characters', CH.kingdew5))).toBe(false);
  });
});

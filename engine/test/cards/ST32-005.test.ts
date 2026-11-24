/** ST32-005 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAttack, donArea, NONSLASH_LEADER, offeredPicks, SLASH_LEADER } from './helpers-stg1.ts';

const ID = 'ST32-005';

const played = (leader: string, opp: Parameters<typeof game>[1]['characters'] = []) =>
  game({ leader, hand: [ID], ...donArea(1) }, { leader: PLAIN_BLUE, characters: opp });

describe('ST32-005 Roronoa Zoro', () => {
  it('[Rush: Character]: can attack a Character the turn it is played, not the Leader', () => {
    const g = played(NONSLASH_LEADER, [{ card: V.c4, rested: true }]);
    play(g, ID);
    const me = g.find('p1', 'characters', ID);
    expect(g.card(me).keywords).toContain('Rush: Character');
    expect(canAttack(g, me, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canAttack(g, me, g.leader('p2'))).toBe(false);
  });

  it("[On Play]: if your Leader has the <Slash> attribute, rest up to 1 of your opponent's Characters with a cost of 2 or less", () => {
    const g = played(SLASH_LEADER, [V.c1, V.c2]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('without a <Slash> Leader nothing is asked and nothing is rested', () => {
    const g = played(NONSLASH_LEADER, [V.c1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('a cost of 3 is not a candidate (exact boundary); with only one the choice is still "up to"', () => {
    const g = played(SLASH_LEADER, [V.c3, V.c2]);
    play(g, ID);
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c2)]);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('only 1 Character is rested even when two qualify', () => {
    const g = played(SLASH_LEADER, [V.c1, V.c2]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(offeredPicks(g)).not.toContain(g.find('p2', 'characters', V.c2));
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });
});

/** ST32-004 Silvers Rayleigh. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAttack, donArea, NONSLASH_LEADER, offeredPicks, SLASH_LEADER } from './helpers-stg1.ts';

const ID = 'ST32-004';

describe('ST32-004 Silvers Rayleigh', () => {
  const played = (leader: string, opp: Parameters<typeof game>[1]['characters'] = []) =>
    game({ leader, hand: [ID], ...donArea(4) }, { leader: PLAIN_BLUE, characters: opp });

  it('if your Leader has the <Slash> attribute, this Character gains [Rush: Character]: it can attack Characters the turn it is played, not the Leader', () => {
    const g = played(SLASH_LEADER, [{ card: V.c4, rested: true }]);
    play(g, ID);
    const me = g.find('p1', 'characters', ID);
    expect(g.card(me).keywords).toContain('Rush: Character');
    expect(canAttack(g, me, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canAttack(g, me, g.leader('p2'))).toBe(false);
  });

  it('without a <Slash> Leader it has no Rush at all', () => {
    const g = played(NONSLASH_LEADER, [{ card: V.c4, rested: true }]);
    play(g, ID);
    const me = g.find('p1', 'characters', ID);
    expect(g.card(me).keywords).not.toContain('Rush: Character');
    expect(canAttack(g, me, g.find('p2', 'characters', V.c4))).toBe(false);
  });

  it("[On Play]: rests up to 2 of your opponent's Characters with a cost of 2 or less", () => {
    const g = played(SLASH_LEADER, [V.c1, V.c2, V.c3]);
    play(g, ID);
    expect(offeredPicks(g)).toContain(g.find('p2', 'characters', V.c1));
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c2)]);
    const rested = (c: string) => g.card(g.find('p2', 'characters', c)).rested;
    expect([rested(V.c1), rested(V.c2), rested(V.c3)]).toEqual([true, true, false]);
  });

  it('a cost of 3 is not a candidate; "up to 2" may take 1 or none', () => {
    const g = played(NONSLASH_LEADER, [V.c2, V.c3]);
    play(g, ID);
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c2)]);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('the [On Play] does not need the <Slash> Leader (it is not conditional)', () => {
    const g = played(NONSLASH_LEADER, [V.c1]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
  });
});

/** OP16-043 Usopp. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, game, hand, pick, V } from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER, koedInBattle } from './helpers-op16g2.ts';

const ID = 'OP16-043';
/** OP15-039 Rebecca: Blue Leader with the {Dressrosa} type (its [Activate: Main] is inert here). */
const DRESSROSA_LEADER = 'OP15-039';
/** OP15-057 Dressrosa Kingdom: a Blue {Dressrosa} Stage. */
const DRESSROSA_STAGE = 'OP15-057';

describe('OP16-043 Usopp', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: IMPEL_LEADER, characters: [ID] }, { leader: BLUE_LEADER });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On K.O.] rest your {Dressrosa} Leader: return up to 1 opposing Character with a cost of 5 or less to the owner's hand", () => {
    const g = koedInBattle(ID, { leader: DRESSROSA_LEADER }, { characters: [V.c5] });
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hand(g, 'p2')).toContain(V.c5);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c6]);
  });

  it('a Character with a cost of 6 is not a candidate (the attacker, cost 6, stays)', () => {
    const g = koedInBattle(ID, { leader: DRESSROSA_LEADER }, { characters: [V.c5] });
    accept(g);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).toEqual([
      g.find('p2', 'characters', V.c5),
    ]);
  });

  it('a {Dressrosa} Stage pays the cost instead of the Leader', () => {
    const g = koedInBattle(
      ID,
      { leader: IMPEL_LEADER, stage: DRESSROSA_STAGE },
      { characters: [V.c3] },
    );
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'stage', DRESSROSA_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g, 'p2')).toContain(V.c3);
  });

  it('the cost may be declined: nothing is rested or returned', () => {
    const g = koedInBattle(ID, { leader: DRESSROSA_LEADER }, { characters: [V.c5] });
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('without a {Dressrosa} Leader or Stage the cost cannot be paid and nothing is asked', () => {
    const g = koedInBattle(ID, { leader: IMPEL_LEADER }, { characters: [V.c5] });
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
  });
});

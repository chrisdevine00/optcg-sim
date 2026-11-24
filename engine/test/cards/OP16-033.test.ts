/** OP16-033 Morley. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, dec, expectDecision, game, V } from './helpers.ts';
import { pickDon } from './helpers-rgl-penel.ts';
import { BLUE_LEADER, IMPEL_LEADER, koedInBattle } from './helpers-op16g2.ts';

const ID = 'OP16-033';
const ids = (g: ReturnType<typeof koedInBattle>) => g.zone('p1', 'characters').map((c) => c.card);

describe('OP16-033 Morley', () => {
  it('has [Unblockable]', () => {
    const g = game({ leader: IMPEL_LEADER, characters: [ID] }, { leader: BLUE_LEADER });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Unblockable');
  });

  it("would be K.O.'d: may rest 2 of your cards instead (the Leader and a Character are exactly 2)", () => {
    const g = koedInBattle(ID, { characters: [V.c1] });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g)).toContain(ID);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(ID);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
  });

  it('active DON!! count as "your cards": the player chooses which 2 to rest', () => {
    const g = koedInBattle(ID, { costArea: { active: 3, rested: 0 } });
    accept(g);
    g.act({ type: 'pick', choice: g.leader('p1') });
    pickDon(g, 'active', 1);
    expect(ids(g)).toContain(ID);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it("may be declined: Morley is K.O.'d and nothing is rested", () => {
    const g = koedInBattle(ID, { characters: [V.c1] });
    decline(g);
    expect(ids(g)).not.toContain(ID);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('with only 1 card that can be rested it is not offered (Morley itself is already rested)', () => {
    const g = koedInBattle(ID, { costArea: { active: 0, rested: 0 } });
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });
});

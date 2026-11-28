/** OP18-031 Nico Robin. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { accept, dec, decline, expectDecision, game, none, pick } from './helpers.ts';
import { candidates, ids, mk, OPP, plantOpponentEffect } from './helpers-a10g1.ts';
import { FF2, PLAIN_BLUE, PLAIN_PURPLE, SHC3, STAGE3 } from './helpers-op18.ts';

const ID = 'OP18-031';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('OP18-031 Nico Robin', () => {
  it("[Opponent's Turn] rests Robin instead when your Character would be removed by the opponent's effect", () => {
    const g = mk({ characters: [ID, SHC3] }, {}, OPP);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', SHC3)]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, SHC3]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('declining lets it go; a rested Robin cannot cover again', () => {
    const g = mk({ characters: [ID, SHC3] }, {}, OPP);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', SHC3)]);
    decline(g);
    expect(ids(g, 'p1', 'trash')).toEqual([SHC3]);
    const r = mk({ characters: [{ card: ID, rested: true }, SHC3] }, {}, OPP);
    plantOpponentEffect(r, KO);
    pick(r, [r.find('p1', 'characters', SHC3)]);
    expectDecision(r, 'main', 'p2');
    expect(ids(r, 'p1', 'trash')).toEqual([SHC3]);
  });

  it('covers Robin herself too ("your Character")', () => {
    const g = mk({ characters: [ID] }, {}, OPP);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', ID)]);
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it("must not apply on your own turn, even to the opponent's effect (a Life [Trigger] K.O.)", () => {
    const g = game(
      { leader: { card: PLAIN_PURPLE, don: 2 }, characters: [ID, SHC3] },
      { leader: PLAIN_BLUE, life: ['ST05-007'] },
    );
    // p2's Life card carries a planted [Trigger]: K.O. up to 1 of the opponent's Characters.
    g.state = withAbilities(g.state, 'ST05-007', [
      {
        id: 'trigger',
        kind: 'trigger',
        effect: [{ do: { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } } }],
      } as unknown as Ability,
    ]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'characters', SHC3)]);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'trash')).toEqual([SHC3]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });

  it('[End of Your Turn] sets up to 1 {Water Seven} card and up to 1 DON!! active', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [ID, { card: FF2, rested: true }, { card: SHC3, rested: true }],
        stage: { card: STAGE3, rested: true },
        costArea: { active: 0, rested: 3 },
      },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'endTurn' });
    expectDecision(g, 'choose', 'p1');
    // Robin is {Water Seven} too; the rested non-{Water Seven} Character is not offered.
    expect(candidates(g).sort()).toEqual(
      [
        g.find('p1', 'characters', ID),
        g.find('p1', 'characters', FF2),
        g.find('p1', 'stage', STAGE3),
      ].sort(),
    );
    pick(g, [g.find('p1', 'characters', FF2)]);
    if (g.decider === 'p1') {
      const d = expectDecision(g, 'choose', 'p1');
      if (d.options?.length) g.act({ type: 'pick', choice: { option: d.options[0]!.id } });
      else none(g);
    }
    expect(g.card(g.find('p1', 'characters', FF2)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', SHC3)).rested).toBe(true);
  });
});

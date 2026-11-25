/** OP09-080 Thousand Sunny (Stage, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  dec,
  decline,
  don,
  expectDecision,
  game,
  idsOf,
  koBy,
  koedInBattle,
  OTHER_LEADER,
  pick,
  plantOpponentEffect,
  PLAIN_BLUE,
  rested,
  SHC1,
  SHC4,
  V,
} from './helpers-a09g4.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';

const ID = 'OP09-080';
const OPP = { turn: 4, activePlayer: 'p2' } as const;
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };
const BOUNCE = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
    to: { zone: 'hand' },
  },
};

describe("OP09-080 Thousand Sunny: [Opponent's Turn]", () => {
  const start = (stage: string | { card: string; rested?: boolean } = ID) =>
    game(
      {
        leader: OTHER_LEADER,
        stage,
        characters: [SHC4, V.c3],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE },
      OPP,
    );
  /** p2's planted effect hits p1's `target`. */
  const hit = (g: ReturnType<typeof start>, target: string, action: object = KO) => {
    const id = g.find('p1', 'characters', target);
    plantOpponentEffect(g, action as Record<string, unknown>);
    if (dec(g)?.kind === 'choose') pick(g, [id]);
  };
  const sunny = (g: ReturnType<typeof start>) => g.find('p1', 'stage', ID);

  it("rest this Stage: when your Straw Hat Crew Character is K.O.'d by your opponent's effect, add up to 1 DON!! from your DON!! deck, rested", () => {
    const g = start();
    hit(g, SHC4);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
    expect(g.card(sunny(g)).rested).toBe(true);
    expect(idsOf(g, 'p1', 'trash')).toEqual([SHC4]);
  });

  it('any removal by an effect counts: returned to the hand', () => {
    const g = start();
    hit(g, SHC4, BOUNCE);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, deck: 6 });
    expect(idsOf(g, 'p1', 'hand')).toEqual([SHC4]);
  });

  it('declining: the Stage stays active and no DON!! is added', () => {
    const g = start();
    hit(g, SHC4);
    decline(g);
    expect(g.card(sunny(g)).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });

  it('a Character that is not Straw Hat Crew does not trigger it', () => {
    const g = start();
    hit(g, V.c3);
    expectDecision(g, 'main', 'p2');
    expect(g.card(sunny(g)).rested).toBe(false);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it("must not fire when the Character is K.O.'d in battle (not removed by an effect)", () => {
    const g = koedInBattle(SHC1, { leader: OTHER_LEADER, stage: ID });
    expect(idsOf(g, 'p1', 'trash')).toEqual([SHC1]);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
  });

  it('must not fire on your own turn: an effect of the opponent cannot make you pay it', () => {
    const g = game(
      { leader: OTHER_LEADER, stage: ID, characters: [SHC4], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    koBy(g, 'p1', SHC4, 'p2');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
  });

  it('the cost cannot be paid with a rested Stage: no offer', () => {
    const g = start(rested(ID));
    hit(g, SHC4);
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1').deck).toBe(7);
  });

  it("must not fire when your own effect removes the Character on your opponent's turn", () => {
    // A planted [On Your Opponent's Attack] of p1's own Leader K.O.s one of p1's own Characters.
    const g = game(
      {
        leader: OTHER_LEADER,
        stage: ID,
        characters: [SHC4, V.c3],
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      OPP,
    );
    g.state = withAbilities(g.state, OTHER_LEADER, [
      {
        id: 'own',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [{ do: { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } } }],
      } as unknown as Ability,
    ]);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    pick(g, [g.find('p1', 'characters', SHC4)]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([SHC4]);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(false);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('"up to 1": may add none', () => {
    const g = start();
    hit(g, SHC4);
    accept(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toEqual(['1', '0']);
    g.act({ type: 'pick', choice: { option: '0' } });
    expect(don(g, 'p1')).toMatchObject({ rested: 0, deck: 7 });
  });
});

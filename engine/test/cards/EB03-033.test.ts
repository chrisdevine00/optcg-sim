/** EB03-033 Charlotte Brulee. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  addMost,
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { BMP_LEADER, plantRun, returnNow } from './helpers-w5c1.ts';

const ID = 'EB03-033';
/** On "your opponent attacks", the card returns `n` of its owner's DON!! (a stand-in for a returning effect). */
const returnsOnAttack = (n: number): Ability =>
  ({
    id: 'x',
    kind: 'auto',
    when: ['onOpponentAttack'],
    effect: [{ do: { returnDon: { n } } }],
  }) as unknown as Ability;

/** The opponent's turn: p2's Character attacks p1's Leader; p1's `returners` return 1 DON!! each. */
const attacked = (leader: string, returners: string[] = [BLUE]) => {
  const g = game(
    { leader, characters: [ID, ...returners], costArea: { active: 4, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    { turn: 4, activePlayer: 'p2' },
  );
  for (const r of returners) g.state = withAbilities(g.state, r, [returnsOnAttack(1)]);
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  return g;
};

describe('EB03-033 Charlotte Brulee', () => {
  it("[Opponent's Turn] your effect returns a DON!!, with a {Big Mom Pirates} Leader: add 1 DON!! rested", () => {
    const g = attacked(BMP_LEADER);
    addMost(g);
    // 4 on the field, 1 returned, 1 added rested; the deck had 6, +1 -1.
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
    expectDecision(g, 'block', 'p1');
  });

  it('"up to 1": the DON!! may be left in the deck', () => {
    const g = attacked(BMP_LEADER);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toContain('0');
    g.act({ type: 'pick', choice: { option: '0' } });
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });

  it('must not fire with a Leader that is not {Big Mom Pirates}', () => {
    const g = attacked(PLAIN_PURPLE);
    expect(dec(g)?.kind).toBe('block');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });

  it('once per turn: a second DON!! return in the same turn adds nothing', () => {
    const g = attacked(BMP_LEADER, [BLUE, V.c1]);
    // Both planted returns trigger together: resolve them in any order.
    expectDecision(g, 'order', 'p1');
    g.act(g.legal()[0]!);
    addMost(g);
    expect(dec(g)?.kind).toBe('block');
    // 4 - 2 returned + 1 added rested.
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1, deck: 7 });
  });

  it("must not fire when your opponent's effect makes you return the DON!!", () => {
    const g = game(
      { leader: BMP_LEADER, characters: [ID], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    plantRun(g, 'p2', V.c3, [{ do: { returnDon: { n: 1, player: 'opponent' } } }]);
    while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });

  it('must not fire on your own turn', () => {
    const g = game(
      { leader: BMP_LEADER, characters: [ID, BLUE], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    returnNow(g, BLUE, 1);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
  });
});

/** EB05-048 Hedgehog Stinger: [Main] You may rest 1 of your DON!! cards and K.O. 1 of your {Baroque Works} Characters: All of your opponent's Characters with a cost of 0 cannot activate [Blocker] during this turn. [Counter] Your Leader gains +3000 power during this battle. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  passBlock,
  payDon,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { lowerOpponentCost } from './helpers-eb05g3.ts';
import { ids } from './helpers-robin.ts';

const HEDGEHOG = 'EB05-048';
/** OP14-095 Mr.9: a vanilla Baroque Works Character. */
const BW = 'OP14-095';
/** Two printed [Blocker] Characters, both cost 4: Trafalgar Law and Boa Hancock. */
const LAW = 'ST10-010';
const BOA = 'ST17-004';

describe('EB05-048 Hedgehog Stinger', () => {
  /** p1 (Baroque Works Leader) holds the Event; Law is lowered to cost 0 first when `zero`. */
  const main = (chars: string[], zero: boolean) => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        hand: [HEDGEHOG],
        characters: chars,
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_PURPLE, characters: [LAW, BOA] },
    );
    if (zero) lowerOpponentCost(g, PLAIN_BLUE, { name: 'Trafalgar Law' });
    play(g, HEDGEHOG);
    return g;
  };

  it('[Main] rest 1 DON!! and K.O. a Baroque Works Character: cost 0 Characters cannot block this turn', () => {
    const g = main([BW], true);
    accept(g);
    payDon(g);
    expect(ids(g, 'p1', 'trash')).toContain(BW);
    // 3 DON!!: 1 for the Event's cost, 1 rested for the ability.
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
    // p1's Leader attacks: Boa (cost 4) may block, Law (cost 0) may not.
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expectDecision(g, 'block', 'p2');
    const blockers = g
      .legal()
      .filter((a) => a.type === 'block' && a.blocker !== null)
      .map((a) => (a.type === 'block' ? a.blocker : null));
    expect(blockers).toEqual([g.find('p2', 'characters', BOA)]);
    passBlock(g);
    endCounter(g);
  });

  it('without the Event a cost 0 Blocker can still block (control)', () => {
    const g = game({ leader: PLAIN_BLUE }, { leader: PLAIN_PURPLE, characters: [LAW, BOA] });
    lowerOpponentCost(g, PLAIN_BLUE, { name: 'Trafalgar Law' });
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    const blockers = g.legal().filter((a) => a.type === 'block' && a.blocker !== null);
    expect(blockers).toHaveLength(2);
  });

  it('[Main] the cost may be declined: nothing is K.O.ed and Blockers are unaffected', () => {
    const g = main([BW], true);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([BW]);
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    expect(g.legal().filter((a) => a.type === 'block' && a.blocker !== null)).toHaveLength(2);
  });

  it('[Main] cannot be paid without a {Baroque Works} Character of yours', () => {
    const g = main([V.c1], true);
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  it('[Counter] your Leader gains +3000 power during this battle only', () => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        hand: [HEDGEHOG],
        costArea: { active: 1, rested: 0 },
        life: [V.c1, V.c1],
      },
      { leader: PLAIN_PURPLE, characters: [V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', HEDGEHOG), ability: 'counter' });
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    // 8000 beats the 7000 attacker: no damage, and the bonus is gone after the battle.
    expectDecision(g, 'main', 'p2');
    expect(g.life('p1')).toBe(2);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

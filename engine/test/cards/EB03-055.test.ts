/** EB03-055 Nico Robin (cost 7). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  expectDecision,
  game,
  hand,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { koBy } from './helpers-w3s.ts';
import { finishBattle, mk, SHC_LEADER } from './helpers-w4sb.ts';

const ID = 'EB03-055';
const deck = [V.c4, V.c5, V.c6];
const lifeCards = (g: ReturnType<typeof mk>, p: 'p1' | 'p2' = 'p1') =>
  g.zone(p, 'life').map((c) => c.card);
const play = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });

/** p2 attacks p1's rested Robin with a 9000 Character and wins the battle: [On K.O.] is next. */
function koed() {
  const g = game(
    { leader: SHC_LEADER, characters: [{ card: ID, rested: true }], life: [V.c1, V.c2, V.c3] },
    { leader: PLAIN_BLUE, characters: [V.c7], life: [V.c4, V.c5, V.c6] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', ID),
  });
  finishBattle(g);
  return g;
}

describe('EB03-055 Nico Robin', () => {
  it('[On Play]: with a {Straw Hat Crew} Leader, trash 1 Life to add up to 2 deck cards to the top of Life', () => {
    const g = mk({ hand: [ID], leader: SHC_LEADER, life: [V.c1, V.c2, V.c3], deck });
    play(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    accept(g);
    accept(g);
    expect(lifeCards(g)).toEqual([V.c5, V.c4, V.c2, V.c3]);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c6]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('"up to 2": one card, or none, may be added (the Life card stays lost)', () => {
    const g = mk({ hand: [ID], leader: SHC_LEADER, life: [V.c1, V.c2, V.c3], deck });
    play(g);
    accept(g);
    accept(g);
    decline(g);
    expect(lifeCards(g)).toEqual([V.c4, V.c2, V.c3]);
    const h = mk({ hand: [ID], leader: SHC_LEADER, life: [V.c1, V.c2, V.c3], deck });
    play(h);
    accept(h);
    decline(h);
    decline(h);
    expect(lifeCards(h)).toEqual([V.c2, V.c3]);
  });

  it('must not add with another Leader: the cost is still paid, nothing is added', () => {
    const g = mk({ hand: [ID], leader: PLAIN_BLUE, life: [V.c1, V.c2, V.c3], deck });
    play(g);
    accept(g);
    expect(lifeCards(g)).toEqual([V.c2, V.c3]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('boundary: with 0 Life the cost cannot be paid and nothing is asked', () => {
    const g = mk({ hand: [ID], leader: SHC_LEADER, life: [], deck });
    play(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it("[Opponent's Turn] [On K.O.]: you may deal 1 damage to your opponent", () => {
    const g = koed();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expectDecision(g, 'trigger', 'p2');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p2')).toBe(2);
    expect(hand(g, 'p2')).toEqual([V.c4]);
  });

  it('the damage may be declined', () => {
    const g = koed();
    decline(g);
    expect(g.life('p2')).toBe(3);
  });

  it('must not fire when K.O.’d on your own turn', () => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, life: [V.c4, V.c5, V.c6] },
    );
    koBy(g, 'p1', ID, 'p1');
    expect(dec(g)?.kind).toBe('main');
    expect(g.life('p2')).toBe(3);
  });
});

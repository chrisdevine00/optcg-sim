/** OP06-115 You're the One Who Should Disappear. Reading recorded in docs/research/m4b-wave2/hancock-rosi.md. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { damageGame, HANCOCK } from './helpers-hancock-rosi.ts';

describe("OP06-115 You're the One Who Should Disappear.", () => {
  const counter = (handCards: string[]) => {
    const g = game(
      { leader: HANCOCK, hand: ['OP06-115', ...handCards], characters: [V.c1] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP06-115'), ability: 'counter' });
    return g;
  };

  it('[Counter] trash 1 card from hand: your Leader or Character gains +3000 power during this battle', () => {
    const g = counter([BLUE]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(trash(g, 'p1')).toContain(BLUE);
    expectDecision(g, 'counter', 'p1');
  });

  it('may target a Character instead', () => {
    const g = counter([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the cost may be declined: no card is trashed and no power is gained', () => {
    const g = counter([BLUE]);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no other card in hand the cost cannot be paid', () => {
    const g = counter([]);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  describe('[Trigger]', () => {
    it('with 0 Life: adds the top card of your deck to your Life, then trashes 1 card from hand', () => {
      // The hit takes the only Life card, so you have 0 Life as the [Trigger] resolves.
      const g = damageGame('OP06-115', {
        leader: HANCOCK,
        life: ['OP06-115'],
        hand: [BLUE],
        deck: [V.c1, V.c2],
      });
      g.act({ type: 'trigger', activate: true });
      accept(g);
      expect(g.zone('p1', 'life').map((c) => c.card)).toEqual([V.c1]);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(hand(g, 'p1')).toEqual([]);
      expect(trash(g, 'p1').sort()).toEqual([BLUE, 'OP06-115'].sort());
    });

    it('the add may be declined; the trash still happens ("Then")', () => {
      const g = damageGame('OP06-115', {
        leader: HANCOCK,
        life: ['OP06-115'],
        hand: [BLUE],
        deck: [V.c1],
      });
      g.act({ type: 'trigger', activate: true });
      decline(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(g.life('p1')).toBe(0);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('with 1 or more Life left nothing happens, not even the trash', () => {
      const g = damageGame('OP06-115', {
        leader: HANCOCK,
        life: ['OP06-115', PURPLE],
        hand: [BLUE],
        deck: [V.c1],
      });
      g.act({ type: 'trigger', activate: true });
      expect(g.life('p1')).toBe(1);
      expect(hand(g, 'p1')).toEqual([BLUE]);
    });
  });
});

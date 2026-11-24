/** OP15-002 Lucy (Leader). */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  takeDamage,
  trash,
  V,
} from './helpers.ts';
import {
  activate,
  canPick,
  EVENT_2,
  EVENT_3,
  EVENT_4,
  inertEvents,
  offeredAb,
  STAGE,
} from './helpers-w3s.ts';

const ID = 'OP15-002';

describe('OP15-002 Lucy', () => {
  describe('[When Attacking]: trash any number of Event or Stage cards: +1000 power each during this battle', () => {
    const start = (handCards: string[]) =>
      game(
        { leader: ID, hand: handCards, costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
    const attack = (g: ReturnType<typeof start>) =>
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

    it('trashing 2 (an Event and a Stage) gives +2000 until the end of the battle only', () => {
      const g = start([EVENT_2, STAGE, V.c1]);
      attack(g);
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.find('p1', 'hand', EVENT_2))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', STAGE))).toBe(true);
      expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // a Character is not a candidate
      pick(g, [g.find('p1', 'hand', EVENT_2), g.find('p1', 'hand', STAGE)]);
      expect(trash(g, 'p1').sort()).toEqual([EVENT_2, STAGE].sort());
      expect(hand(g, 'p1')).toEqual([V.c1]);
      expectDecision(g, 'block', 'p2');
      expect(g.power(g.leader('p1'))).toBe(7000);
      passBlock(g);
      endCounter(g);
      takeDamage(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('trashing 1 of 2 gives +1000', () => {
      const g = start([EVENT_2, STAGE]);
      attack(g);
      pick(g, [g.find('p1', 'hand', STAGE)]);
      expect(g.power(g.leader('p1'))).toBe(6000);
      expect(hand(g, 'p1')).toEqual([EVENT_2]);
    });

    it('"any number": trashing none gives +0 and keeps the hand', () => {
      const g = start([EVENT_2, STAGE]);
      attack(g);
      none(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(hand(g, 'p1')).toHaveLength(2);
      expectDecision(g, 'block', 'p2');
    });

    it('with no Event or Stage in hand the pick is still asked at 0 (the hand contents are secret), then nothing changes', () => {
      const g = start([V.c1, BLUE]);
      attack(g);
      const d = expectDecision(g, 'choose', 'p1');
      expect(d.max).toBe(0);
      g.act({ type: 'done' });
      expectDecision(g, 'block', 'p2');
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('with an empty hand (public) nothing is asked', () => {
      const g = start([]);
      attack(g);
      expectDecision(g, 'block', 'p2');
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });

  describe('[On Your Opponent’s Attack]: the same, on the defending Leader', () => {
    it('trashing 1 Event gives +1000 during this battle (the attack then misses a 6000 power)', () => {
      const g = game(
        { leader: ID, hand: [EVENT_2, V.c1], life: [BLUE, BLUE, BLUE, BLUE] },
        { leader: PLAIN_BLUE, characters: [V.c6] }, // 8000
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c6),
        target: g.leader('p1'),
      });
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', EVENT_2)]);
      passBlock(g);
      expectDecision(g, 'counter', 'p1');
      expect(g.power(g.leader('p1'))).toBe(6000);
      endCounter(g);
      takeDamage(g);
      expect(g.life('p1')).toBe(3); // 6000 < 8000: Lucy was hit
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('it is the Leader that gains the power, also when a Character is attacked', () => {
      const g = game(
        { leader: ID, hand: [EVENT_2], characters: [{ card: V.c1, rested: true }] },
        { leader: PLAIN_BLUE, characters: [V.c6] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c6),
        target: g.find('p1', 'characters', V.c1),
      });
      pick(g, [g.find('p1', 'hand', EVENT_2)]);
      expect(g.power(g.leader('p1'))).toBe(6000);
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
    });
  });

  describe('[Activate: Main] [Once Per Turn]: with an Event of base cost 3 or more activated this turn, draw 1', () => {
    const start = (handCards: string[]) => {
      const g = game(
        { leader: ID, hand: handCards, deck: [V.c1, V.c2], costArea: { active: 8, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      inertEvents(g, EVENT_2, EVENT_3, EVENT_4);
      return g;
    };

    it('draws after a cost 3 Event (the boundary) and a cost 4 Event', () => {
      for (const ev of [EVENT_3, EVENT_4]) {
        const g = start([ev]);
        play(g, ev);
        activate(g, g.leader('p1'), 'draw');
        expect(hand(g, 'p1')).toEqual([V.c1]);
      }
    });

    it('does not draw after a cost 2 Event, or with no Event', () => {
      const g = start([EVENT_2]);
      play(g, EVENT_2);
      activate(g, g.leader('p1'), 'draw');
      expect(hand(g, 'p1')).toEqual([]);
      const h = start([V.c1]);
      activate(h, h.leader('p1'), 'draw');
      expect(hand(h, 'p1')).toEqual([V.c1]); // only the card that was already there
    });

    it('a cost 2 Event and a cost 3 Event together: the 3 is enough', () => {
      const g = start([EVENT_2, EVENT_3]);
      play(g, EVENT_2);
      play(g, EVENT_3);
      activate(g, g.leader('p1'), 'draw');
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });

    it('is Once Per Turn, spent even when the condition was false', () => {
      const g = start([EVENT_3]);
      activate(g, g.leader('p1'), 'draw'); // nothing activated yet: no draw, the use is spent
      expect(offeredAb(g, g.leader('p1'), 'draw')).toBe(false);
      play(g, EVENT_3);
      expect(hand(g, 'p1')).toEqual([]);
      expect(offeredAb(g, g.leader('p1'), 'draw')).toBe(false);
    });

    it('only this turn: an Event activated last turn does not count', () => {
      const g = start([EVENT_3]);
      play(g, EVENT_3);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' }); // p1's turn 5: a new turn, an empty record
      const before = hand(g, 'p1').length;
      activate(g, g.leader('p1'), 'draw');
      expect(hand(g, 'p1')).toHaveLength(before);
    });
  });
});

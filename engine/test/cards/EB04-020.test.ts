/** EB04-020 Shark Brick Fist. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, hand, none, pick, takeDamage } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { at, canPick, FISH3, FISH_LEADER, isRested, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-020';
const rested = (card: string) => ({ card, rested: true });

describe('EB04-020 Shark Brick Fist', () => {
  const step = (leader: string = FISH_LEADER) =>
    counterStep({
      leader,
      hand: [ID],
      characters: [rested(FISH3), rested(V.c1)],
      costArea: { active: 1, rested: 0 },
    });

  it('[Counter]: a {Fish-Man} Leader gains +3000 this battle; then a {Fish-Man} Character is set active', () => {
    const g = step();
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, at(g, 'p1', 'characters', V.c1))).toBe(false); // not {Fish-Man}
    pick(g, [at(g, 'p1', 'characters', FISH3)]);
    expect(isRested(g, at(g, 'p1', 'characters', FISH3))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', V.c1))).toBe(true);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the power may go to a {Fish-Man} Character instead', () => {
    const g = step();
    useCounter(g, ID);
    pick(g, [at(g, 'p1', 'characters', FISH3)]);
    expect(g.power(at(g, 'p1', 'characters', FISH3))).toBe(8000);
    pick(g, [at(g, 'p1', 'characters', FISH3)]);
    expect(isRested(g, at(g, 'p1', 'characters', FISH3))).toBe(false);
  });

  it('"Then" is independent: with the power skipped the Character is still set active', () => {
    const g = step();
    useCounter(g, ID);
    none(g);
    pick(g, [at(g, 'p1', 'characters', FISH3)]);
    expect(isRested(g, at(g, 'p1', 'characters', FISH3))).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": both picks may be skipped', () => {
    const g = step();
    useCounter(g, ID);
    none(g);
    none(g);
    expect(isRested(g, at(g, 'p1', 'characters', FISH3))).toBe(true);
  });

  it('a Leader that is not {Fish-Man} is not a power target', () => {
    const g = step(RED_LEADER);
    useCounter(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, at(g, 'p1', 'characters', FISH3))).toBe(true);
  });

  describe('[Trigger]', () => {
    const hit = () => damageGame(ID, { leader: RED_LEADER }, { characters: [V.c4, V.c5, V.c1] });

    it('rests up to 1 opposing Character with a cost of 4 or less (5 is out)', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, at(g, 'p2', 'characters', V.c4))).toBe(true); // cost 4: boundary
      expect(canPick(g, at(g, 'p2', 'characters', V.c5))).toBe(false); // cost 5
      pick(g, [at(g, 'p2', 'characters', V.c4)]);
      expect(isRested(g, at(g, 'p2', 'characters', V.c4))).toBe(true);
    });

    it('not activating adds the card to your hand and rests nothing', () => {
      const g = hit();
      g.act({ type: 'trigger', activate: false });
      expect(hand(g, 'p1')).toContain(ID);
      expect(isRested(g, at(g, 'p2', 'characters', V.c4))).toBe(false);
    });
  });
});

/**
 * OP13-063 Kouzuki Oden (Character, Purple, cost 5, 6000, Counter +1000, {Land of Wano}/{Kouzuki
 * Clan}/{Roger Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] If you have any DON!! cards given, add up to 1 DON!! card from your
 * DON!! deck and rest it."
 *
 * Rules: CR 10-1-4 ([Blocker], a rested Character cannot block), E-Q11 (the count of "add up to N
 * DON!!"), CR 4-8-1, CR 3-9-3.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  addDon,
  asksCount,
  atMain,
  blockers,
  ch,
  countOptions,
  defend,
  don,
  kind,
  LD13,
  me,
  need,
  playRaw,
  S13,
  type Placed,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-063';

function play(o: { given?: number; active?: number; mineChars?: Placed } = {}): TestGame {
  return me(
    { card: LD13.plain, don: o.given ?? 1 },
    { hand: [ID], characters: o.mineChars ?? [], costArea: { active: o.active ?? 6, rested: 0 } },
  );
}

describe('OP13-063 Kouzuki Oden: [Blocker]; [On Play] if any DON!! given, add up to 1 DON!! rested', () => {
  it('with DON!! given: asks the count and adds 1 RESTED DON!! from the DON!! deck', () => {
    const g = play();
    const before = don(g);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({
      active: before.active - 5,
      rested: before.rested + 5 + 1,
      deck: before.deck - 1,
    });
  });

  it('with no DON!! given: nothing is added and no count is asked', () => {
    const g = play({ given: 0 });
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('DON!! given to one of my Characters satisfies the condition', () => {
    const g = play({ given: 0, mineChars: [{ card: S13.c3, don: 1 }] });
    playRaw(g, ID);
    expect(asksCount(g)).toBe(true);
  });

  it('must not: DON!! given to the opponent’s cards does not count', () => {
    const g = me(
      LD13.plain,
      { hand: [ID], costArea: { active: 6, rested: 0 } },
      { characters: [{ card: S13.c1, don: 2 }] },
    );
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": choosing 0 adds nothing', () => {
    const g = play();
    const before = don(g);
    playRaw(g, ID);
    addDon(g, 0);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('with an empty DON!! deck the count is not asked', () => {
    const g = play({ active: 9 });
    expect(don(g).deck).toBe(0);
    playRaw(g, ID);
    expect(asksCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
  });

  it('has [Blocker]', () => {
    const g = defend(LD13.plain, { characters: [ID] });
    expect(g.card(ch(g, 'p1', ID)).keywords).toContain('Blocker');
  });

  it('blocks an attack on my Leader: the 6000 Blocker takes the 5000 attack and nothing hits my Life', () => {
    const g = defend(LD13.plain, { characters: [ID] });
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([ch(g, 'p1', ID)]);
    act(g, { type: 'block', blocker: ch(g, 'p1', ID) });
    expect(g.card(ch(g, 'p1', ID)).rested).toBe(true);
    while (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('must not: a rested Oden cannot block', () => {
    const g = defend(LD13.plain, { characters: [{ card: ID, rested: true }] });
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    if (kind(g) === 'block') expect(blockers(g)).toEqual([]);
  });
});

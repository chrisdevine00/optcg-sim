/**
 * OP12-115 I Love You!! (Event, Yellow, cost 1; Donquixote Pirates / Navy).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.
 * Then, if you have 2 or less Life cards, add up to 1 [Trafalgar Law] from your trash to your hand."
 *
 * Rules: "during this battle" (CR 7-1-5-3); the boost is unconditional, only the second sentence has the
 * Life condition (CR 4-10-1 does not stop the earlier clause); "[Trafalgar Law]" is a card name
 * (CR 2-1-2) and a card that says "also treat this card's name as [Trafalgar Law]" counts (EB04-038);
 * "up to 1" (CR 8-4-4-1). Trash: OP04-087 Law, OP05-069 Law, EB04-038, OP02-107 Doberman, OP12-108
 * Rosinante (not Law).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  attack,
  BLUE,
  canCounterWith,
  choiceCards,
  choose,
  chooseIfAsked,
  chooseNone,
  kind,
  LD,
  LEAD,
  noDefence,
  passBlock,
  passCounter,
  payWith,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  V,
} from './kit-d.ts';

const EVENT = 'OP12-115';
const TRASH = [V.law5, 'OP05-069', 'EB04-038', V.doberman, 'OP12-108'];

function game(life: number, p1: Partial<PlayerSpec> = {}) {
  const g = theirTurn(
    side(LD.rosinante, BLUE, {
      hand: [EVENT],
      life: rep(BLUE, life),
      trash: TRASH,
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  return g;
}

function use(g: ReturnType<typeof game>) {
  useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
  chooseIfAsked(g, [g.leader('p1')]);
}

describe('OP12-115 I Love You!! [Counter]: +2000 this battle', () => {
  it('the Leader gains +2000 (7000) and a 5000 attack does not get through', () => {
    const g = game(3);
    expect(canCounterWith(g, g.find('p1', 'hand', EVENT))).toBe(true);
    use(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
    if (kind(g) === 'choose') chooseNone(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character can be the target instead', () => {
    const g = theirTurn(
      side(LD.rosinante, BLUE, {
        hand: [EVENT],
        characters: [{ card: V.doberman, rested: true }],
        costArea: { active: 1, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    const dob = g.find('p1', 'characters', V.doberman);
    attack(g, g.leader('p2'), dob);
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', EVENT), dob);
    chooseIfAsked(g, [dob]);
    expect(g.power(dob)).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    noDefence(g);
  });
});

describe('OP12-115 I Love You!! [Counter]: then, with 2 or less Life, add a [Trafalgar Law] from the trash to hand', () => {
  it('2 Life (boundary): Law cards are offered (including EB04-038 by its extra name), nothing else', () => {
    const g = game(2);
    use(g);
    expect(choiceCards(g)).toEqual([V.law5, 'OP05-069', 'EB04-038'].sort());
  });

  it('choosing one moves it from the trash to hand', () => {
    const g = game(2);
    use(g);
    choose(g, [g.find('p1', 'trash', V.law5)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([V.law5]);
    expect(sortedIds(g, 'p1', 'trash')).toContain('OP05-069');
    expect(sortedIds(g, 'p1', 'trash')).not.toContain(V.law5);
    passCounter(g);
    expect(g.life('p1')).toBe(2);
  });

  it('0 Life counts as "2 or less"', () => {
    const g = game(0);
    use(g);
    expect(choiceCards(g)).toEqual([V.law5, 'OP05-069', 'EB04-038'].sort());
  });

  it('CR 8-4-4-1: up to 1 may add nothing; the boost remains', () => {
    const g = game(2);
    use(g);
    chooseNone(g);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('CR 4-10-1: with 3 Life no card is added, but the +2000 still applies', () => {
    const g = game(3);
    use(g);
    expect(kind(g)).not.toBe('choose');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('only from the trash: a Law in hand or deck is not a candidate, and an empty trash adds nothing', () => {
    const g = game(2, { trash: [V.doberman] });
    use(g);
    expect(kind(g)).not.toBe('choose');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    void payWith;
  });
});

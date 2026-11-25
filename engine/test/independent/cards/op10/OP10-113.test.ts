/**
 * OP10-113 Roronoa Zoro (Character, Yellow, cost 3, 5000, {Straw Hat Crew}/{Supernovas}).
 *
 * Card text: "If you have less Life cards than your opponent, this Character gains [Rush].
 * [Trigger] You may trash 1 card from your hand: If your Leader has the {Supernovas} type, play
 * this card."
 *
 * Rules: CR 10-2-?? ([Rush]: may attack the turn it is played), CR 6-5-5-1 (a Character cannot
 * attack the turn it is played unless it has [Rush]), CR 8-3-1-3/-4 (an optional cost; a hidden
 * hand cost is offered even when it cannot be paid, with "use" illegal), colon-less / after-colon
 * "If" is an effect condition, CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  canHit,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  kind,
  kw,
  mayDone,
  LD10,
  mine,
  need,
  offeredIds,
  payHand,
  playId,
  RED,
  SC10,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-113';

function played(myLife: number, theirLife: number) {
  const g = mine(
    LD10.neutral,
    { hand: [ID], life: fill(BLUE, myLife) },
    { life: fill(RED, theirLife) },
  );
  playId(g, ID);
  return g;
}

describe('OP10-113 Zoro: gains [Rush] while I have less Life cards than the opponent', () => {
  it('3 Life against 4: [Rush], and the Character that was just played can attack the Leader', () => {
    const g = played(3, 4);
    const zoro = g.find('p1', 'characters', ID);
    expect(kw(g, zoro)).toContain('Rush');
    expect(canHit(g, zoro, g.leader('p2'))).toBe(true);
  });

  it('boundary: equal Life (4 against 4): no [Rush], and it cannot attack the turn it is played', () => {
    const g = played(4, 4);
    const zoro = g.find('p1', 'characters', ID);
    expect(kw(g, zoro)).not.toContain('Rush');
    expect(canHit(g, zoro, g.leader('p2'))).toBe(false);
  });

  it('more Life than the opponent (5 against 4): no [Rush]', () => {
    const g = played(5, 4);
    expect(kw(g, g.find('p1', 'characters', ID))).not.toContain('Rush');
  });

  it('0 Life against 1 still counts as "less"', () => {
    const g = played(0, 1);
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Rush');
  });

  it("the Rush is live: after Zoro's own attack takes the opponent to 3 Life (equal to mine) it is gone", () => {
    const g = played(3, 4);
    const zoro = g.find('p1', 'characters', ID);
    attack(g, zoro, g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(kw(g, zoro)).not.toContain('Rush');
  });

  it('a Zoro in the hand has no [Rush] to speak of: the effect is on the field', () => {
    const g = mine(LD10.neutral, { hand: [ID], life: fill(BLUE, 3) }, { life: fill(RED, 4) });
    expect(g.card(g.find('p1', 'hand', ID)).keywords).not.toContain('Rush');
  });
});

describe('OP10-113 Zoro [Trigger]: you may trash 1 card from your hand: if your Leader is {Supernovas}, play this card', () => {
  function start(leader: string, hnd: string[] = [SC10.c3, SC10.c4]) {
    const g = theirs(leader, { life: [ID, BLUE, BLUE, BLUE], hand: hnd });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('{Supernovas} Leader: pay by trashing 1 card and Zoro is played (active) onto my field', () => {
    const g = start(LD10.supernovas);
    activateTrigger(g);
    payHand(g, [SC10.c3]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(trash(g)).toEqual([SC10.c3]);
    expect(hand(g)).toEqual([SC10.c4]);
  });

  it('the cost is exactly 1 card chosen from the hand: every card of the hand is offered', () => {
    const g = start(LD10.supernovas);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC10.c3, SC10.c4].sort());
  });

  it('activating the [Trigger] is the choice to pay: the cost is an exact pick of 1 card (not "up to"), asked as a cost', () => {
    const g = start(LD10.supernovas);
    activateTrigger(g);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect(mayDone(g)).toBe(false);
  });

  it('a Leader that is not {Supernovas}: Zoro is not played (the check is after the cost)', () => {
    const g = start(LD10.neutral);
    activateTrigger(g);
    payHand(g, [SC10.c3]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toContain(ID);
  });

  it('with an empty hand the cost cannot be paid: the [Trigger] is still asked (never depends on the hand) but cannot be activated', () => {
    const g = start(LD10.supernovas, []);
    need(g, 'trigger', 'p1');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
    declineTrigger(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([ID]);
  });

  it('declining the [Trigger] itself adds Zoro to my hand', () => {
    const g = start(LD10.supernovas);
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('the trashed card is trashed, not played: only Zoro enters the field', () => {
    const g = start(LD10.supernovas, [SC10.c3]);
    activateTrigger(g);
    payHand(g, [SC10.c3]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });
});

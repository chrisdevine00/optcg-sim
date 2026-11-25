/**
 * OP10-077 Bellamy (Character, Purple, cost 3, 4000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[Blocker] ... [On Block] You may rest 2 of your DON!! cards: Add up to 1 DON!! card
 * from your DON!! deck and set it as active."
 *
 * Rules: CR 10-2-?/[On Block] fires when this card blocks; resting DON!! as a cost needs active
 * DON!! in the cost area (CR 6-5-5); "add up to 1" asks a count, and the added card is active.
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  at,
  attack,
  blockers,
  donOf14,
  LD10,
  need,
  no,
  onField,
  payDon,
  SC10,
  theirs,
  unusable,
  yes,
  act,
  kind,
} from './kit-op10c.ts';

const ID = 'OP10-077';

function game(active: number, rested = 0, o: { donDeck?: number; restedBellamy?: boolean } = {}) {
  const g = theirs(
    LD10.dp,
    {
      characters: [{ card: ID, rested: o.restedBellamy ?? false }],
      costArea: { active, rested },
      ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
    },
    { characters: [SC10.dr5] },
  );
  return g;
}

/** p2's Leader attacks p1's Leader; p1 is at the Block Step. */
function attackLeader(g: ReturnType<typeof game>) {
  attack(g, g.leader('p2'), g.leader('p1'));
  need(g, 'block', 'p1');
}

function block(g: ReturnType<typeof game>) {
  act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
}

describe('OP10-077 Bellamy [Blocker] / [On Block] rest 2 DON!!: add 1 active DON!!', () => {
  it('has [Blocker]: it is a legal block for the attack on the Leader', () => {
    const g = game(3);
    attackLeader(g);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
  });

  it('blocking offers the cost; paying rests 2 active DON!! and adds 1 active DON!!', () => {
    const g = game(3);
    attackLeader(g);
    block(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payDon(g, 2);
    expect(asksCount(g)).toBe(true);
    addDon(g, 1);
    const d = donOf14(g);
    expect(d.active).toBe(2);
    expect(d.rested).toBe(2);
    expect(d.deck).toBe(6);
  });

  it('"up to 1": may add none, the 2 DON!! stay rested', () => {
    const g = game(3);
    attackLeader(g);
    block(g);
    yes(g, 'p1');
    payDon(g, 2);
    addDon(g, 0);
    const d = donOf14(g);
    expect(d.active).toBe(1);
    expect(d.rested).toBe(2);
    expect(onField(g)).toBe(3);
  });

  it('declining the cost: no DON!! rested, none added, the block still stands', () => {
    const g = game(3);
    attackLeader(g);
    block(g);
    no(g, 'p1');
    const d = donOf14(g);
    expect(d.active).toBe(3);
    expect(d.rested).toBe(0);
    expect(d.deck).toBe(7);
    expect(kind(g)).toBe('counter');
  });

  it('with only 1 active DON!! the cost cannot be paid', () => {
    const g = game(1, 5);
    attackLeader(g);
    block(g);
    unusable(g, 'p1');
    const d = donOf14(g);
    expect(d.active).toBe(1);
    expect(d.rested).toBe(5);
    expect(d.deck).toBe(4);
  });

  it('boundary: exactly 2 active DON!! pays; the added DON!! is then the only active one', () => {
    const g = game(2);
    attackLeader(g);
    block(g);
    yes(g, 'p1');
    payDon(g, 2);
    addDon(g, 1);
    const d = donOf14(g);
    expect(d.active).toBe(1);
    expect(d.rested).toBe(2);
  });

  it('rested DON!! cannot pay "rest 2 of your DON!!"', () => {
    const g = game(0, 4);
    attackLeader(g);
    block(g);
    unusable(g, 'p1');
    expect(donOf14(g).rested).toBe(4);
  });

  it('with an empty DON!! deck the cost is paid and nothing is added', () => {
    const g = game(3, 7, { donDeck: 0 });
    expect(donOf14(g).deck).toBe(0);
    attackLeader(g);
    block(g);
    yes(g, 'p1');
    payDon(g, 2);
    if (asksCount(g)) addDon(g, 0);
    const d = donOf14(g);
    expect(d.deck).toBe(0);
    expect(onField(g)).toBe(10);
    expect(d.rested).toBe(9);
  });

  it('must not fire unless Bellamy blocks: another blocker or no block asks nothing', () => {
    const g = game(3);
    attackLeader(g);
    act(g, { type: 'block', blocker: null });
    expect(kind(g)).toBe('counter');
    expect(donOf14(g).active).toBe(3);
  });

  it('a rested Bellamy cannot block, so its [On Block] cannot fire', () => {
    const g = game(3, 0, { restedBellamy: true });
    attackLeader(g);
    expect(blockers(g)).toEqual([]);
  });
});

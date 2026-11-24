/**
 * ST29-001 Monkey.D.Luffy (Leader, Yellow, 5000, 6 Life, {Straw Hat Crew}/{The Four Emperors}/{Egghead}).
 *
 * Card text: "[When Attacking] If you have 2 or less Life cards, draw 1 card and trash 1 card from your
 * hand."
 *
 * Rules: [When Attacking] fires when this Leader declares an attack (CR 10-2); the "If" is checked
 * when the effect resolves and counts the controller's own Life cards; the trash is an exact 1 (no
 * "up to"); the draw comes first, so the drawn card may be the one trashed.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  C29,
  canFinish,
  choices,
  fill,
  hand,
  ids29,
  inst,
  isMain,
  kind,
  mine,
  need,
  passBlock,
  trash,
} from './kit-st29a.ts';

const LEAD = 'ST29-001';

/** p1's Main Phase: ST29-001 with `life` Life cards, `handCards` in hand and a known deck. */
function board(
  life: number,
  handCards: string[],
  opts: { deck?: string[]; p2chars?: string[] } = {},
) {
  return mine(
    LEAD,
    {
      life: fill(C29.c1, life),
      hand: handCards,
      deck: opts.deck ?? [C29.c4, ...fill(C29.c1, 14)],
    },
    { characters: opts.p2chars ?? [] },
  );
}

function swingLeader(g: ReturnType<typeof board>) {
  act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
}

describe('ST29-001 Monkey.D.Luffy: [When Attacking] with 2 or less Life, draw 1 and trash 1', () => {
  it('printed values: 5000 power Leader with 6 Life, named Monkey.D.Luffy', () => {
    const g = board(6, []);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(6);
    expect(g.card(g.leader('p1')).card).toBe('ST29-001');
  });

  it('with exactly 2 Life: draws 1 (the top of the deck) and then asks for 1 card of the hand to trash', () => {
    const g = board(2, [C29.c2, C29.c3]);
    swingLeader(g);
    need(g, 'choose', 'p1');
    // The drawn card (Hajrudin, top of the deck) is already in the hand and is a candidate.
    expect(hand(g)).toEqual([C29.c2, C29.c3, C29.c4].sort());
    expect(choices(g)).toHaveLength(3);
    act(g, { type: 'pick', choice: inst(g, 'p1', 'hand', C29.c3) });
    expect(hand(g)).toEqual([C29.c2, C29.c4].sort());
    expect(trash(g)).toEqual([C29.c3]);
    expect(kind(g)).toBe('block');
  });

  it('with 3 Life (one above the limit): nothing is drawn, nothing is asked, nothing is trashed', () => {
    const g = board(3, [C29.c2]);
    swingLeader(g);
    expect(kind(g)).toBe('block');
    expect(hand(g)).toEqual([C29.c2]);
    expect(trash(g)).toEqual([]);
  });

  it('with 1 Life and with 0 Life the effect also works (the condition is "2 or less")', () => {
    for (const life of [1, 0]) {
      const g = board(life, [C29.c2]);
      swingLeader(g);
      need(g, 'choose', 'p1');
      expect(hand(g)).toHaveLength(2);
      act(g, { type: 'pick', choice: inst(g, 'p1', 'hand', C29.c2) });
      expect(hand(g)).toEqual([C29.c4]);
    }
  });

  it('the trash is exactly 1: it cannot be skipped and a second card cannot be added', () => {
    const g = board(2, [C29.c2, C29.c3]);
    swingLeader(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    act(g, { type: 'pick', choice: inst(g, 'p1', 'hand', C29.c2) });
    // One pick finished the effect: back to the battle, one card trashed.
    expect(kind(g)).toBe('block');
    expect(trash(g)).toEqual([C29.c2]);
  });

  it('with an empty hand the drawn card is the only one in the hand and is trashed (forced or asked, never kept)', () => {
    const g = board(2, []);
    swingLeader(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(1);
      act(g, { type: 'pick', choice: choices(g)[0]! });
    }
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([C29.c4]);
    expect(kind(g)).toBe('block');
  });

  it('counts only my own Life: my 3 Life against an opponent with 0 Life still does nothing', () => {
    const g = mine(LEAD, { life: fill(C29.c1, 3), hand: [C29.c2] }, { life: [] });
    swingLeader(g);
    expect(kind(g)).toBe('block');
    expect(hand(g)).toEqual([C29.c2]);
  });

  it('also fires when the Leader attacks a Character instead of the Leader', () => {
    const g2 = mine(
      LEAD,
      { life: fill(C29.c1, 2), hand: [C29.c2], deck: [C29.c4, ...fill(C29.c1, 14)] },
      { characters: [{ card: C29.c1, rested: true }] },
    );
    act(g2, {
      type: 'attack',
      attacker: g2.leader('p1'),
      target: inst(g2, 'p2', 'characters', C29.c1),
    });
    need(g2, 'choose', 'p1');
    expect(hand(g2)).toHaveLength(2);
  });

  it('must not fire when a Character attacks, or when this Leader is attacked', () => {
    const g = mine(
      LEAD,
      { life: fill(C29.c1, 2), hand: [C29.c2], characters: [C29.c3] },
      { characters: [] },
    );
    act(g, {
      type: 'attack',
      attacker: inst(g, 'p1', 'characters', C29.c3),
      target: g.leader('p2'),
    });
    expect(kind(g)).toBe('block');
    expect(hand(g)).toEqual([C29.c2]);
    passBlock(g);
    act(g, { type: 'endCounter' });
    // p2's Leader attacks nothing here; the effect never fires from p2's attacks either.
    expect(trash(g)).toEqual([]);
    expect(ids29(g, 'p1', 'life')).toHaveLength(2);
  });

  it('the draw happens before the Block Step, so the Counter Step can use the drawn card', () => {
    const g = board(2, [C29.c2]);
    swingLeader(g);
    act(g, { type: 'pick', choice: inst(g, 'p1', 'hand', C29.c2) });
    expect(isMain(g, 'p1')).toBe(false);
    expect(hand(g)).toEqual([C29.c4]);
  });
});

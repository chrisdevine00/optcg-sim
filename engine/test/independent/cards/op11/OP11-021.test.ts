/**
 * OP11-021 Jinbe (Leader, Green, 5000, 5 Life, {Fish-Man}/{Straw Hat Crew}).
 *
 * Card text: "[End of Your Turn] If you have 6 or less cards in your hand, set up to 1 of your
 * "Fish-Man" or "Merfolk" type Characters and up to 1 of your DON!! cards as active."
 *
 * Rules: [End of Your Turn] fires in the controller's End Phase only (CR 10-2-?). "6 or less"
 * includes exactly 6. "Up to 1" may be none for either part. Setting active turns a rested card
 * active; the DON!! count is asked ("add/set up to N DON!!" asks a count, most first).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  chr,
  decision,
  donOf,
  fill,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredIds,
  pickInst,
  takeMost,
} from './kit-op11a.ts';

const rested = (card: string) => ({ card, rested: true });

function board(handN: number, chars: { card: string; rested?: boolean }[] = [rested(N11.fish3)]) {
  return mine(L11.jinbe, {
    characters: chars,
    costArea: { active: 3, rested: 4 },
    hand: fill(BLUE, handN),
  });
}

/** Ends p1's turn and answers the Character question with `pick` (or none), then the DON!! count. */
function endTurnWith(g: ReturnType<typeof board>, pick: string | null, don: 0 | 1) {
  act(g, { type: 'endTurn' });
  need(g, 'choose', 'p1');
  if (pick) pickInst(g, [chr(g, 'p1', pick)]);
  else none(g);
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: { option: String(don) } });
}

describe('OP11-021 Jinbe: [End of Your Turn] set a Fish-Man/Merfolk Character and a DON!! active', () => {
  it('printed values: 5000 power, 5 Life', () => {
    const g = board(0);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });

  it('with 6 cards in hand (boundary): a rested Fish-Man Character and 1 rested DON!! become active', () => {
    const g = board(6);
    endTurnWith(g, N11.fish3, 1);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p1', N11.fish3)).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 3 });
  });

  it('with 7 cards in hand (boundary) nothing happens and nothing is asked', () => {
    const g = board(7);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p1', N11.fish3)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 4 });
  });

  it('with an empty hand it works too', () => {
    const g = board(0);
    endTurnWith(g, N11.fish3, 1);
    expect(g.card(chr(g, 'p1', N11.fish3)).rested).toBe(false);
  });

  it('offers Fish-Man and Merfolk Characters, not other types', () => {
    const g = board(3, [rested(N11.fish3), rested(N11.merfolk3), rested(N11.navy3)]);
    act(g, { type: 'endTurn' });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.fish3, N11.merfolk3].sort());
  });

  it('sets only 1 Character active, even with two eligible', () => {
    const g = board(3, [rested(N11.fish3), rested(N11.merfolk3)]);
    endTurnWith(g, N11.merfolk3, 1);
    expect(g.card(chr(g, 'p1', N11.merfolk3)).rested).toBe(false);
    expect(g.card(chr(g, 'p1', N11.fish3)).rested).toBe(true);
  });

  it('sets only 1 DON!! active, even with 4 rested', () => {
    const g = board(3);
    act(g, { type: 'endTurn' });
    pickInst(g, [chr(g, 'p1', N11.fish3)]);
    const d = decision(g);
    expect(d?.options?.map((o) => o.id)).toEqual(['1', '0']);
    takeMost(g);
    expect(donOf(g, 'p1').active).toBe(4);
  });

  it('"up to 1": choosing no Character still sets the DON!! active', () => {
    const g = board(3);
    endTurnWith(g, null, 1);
    expect(g.card(chr(g, 'p1', N11.fish3)).rested).toBe(true);
    expect(donOf(g, 'p1').active).toBe(4);
  });

  it('"up to 1": choosing 0 DON!! leaves the DON!! as it was', () => {
    const g = board(3);
    endTurnWith(g, N11.fish3, 0);
    expect(g.card(chr(g, 'p1', N11.fish3)).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 4 });
  });

  it('does not fire at the end of the opponent’s turn', () => {
    const g = board(3);
    endTurnWith(g, N11.fish3, 0);
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(decision(g)?.player).toBe('p1');
  });
});

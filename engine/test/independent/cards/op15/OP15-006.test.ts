/**
 * OP15-006 Cavendish (Character, Red, cost 4, 4000, Counter +2000, {Beautiful Pirates}/{Dressrosa}).
 *
 * Card text: "If you have 4 or more Events in your trash, this Character gains +2000 power."
 *
 * Rules: CR 8-1-3-1 (permanent effects apply continuously), CR 3-5 (the trash is public), a card
 * played as an Event goes to the trash after its effect resolves (CR 3-6-2).
 */
import { describe, expect, it } from 'vitest';
import { at, LD15, mine, need, playRaw, S15, SCN, VAN } from './kit-op15a.ts';

const CAVENDISH = 'OP15-006';
/** OP17-097: Black Event, cost 1, [Main] Give all of your opponent's Characters -1 cost. No prompt. */
const PLAIN_MAIN_EVENT = 'OP17-097';

const events = (n: number) => Array.from({ length: n }, () => S15.event);

function board(trash: string[], p2trash: string[] = [], extra: { hand?: string[] } = {}) {
  return mine(
    LD15.luffy,
    { characters: [CAVENDISH], trash, ...(extra.hand ? { hand: extra.hand } : {}) },
    { trash: p2trash, characters: [SCN.c3] },
  );
}
const pow = (g: ReturnType<typeof board>) => g.power(at(g, 'p1', 'characters', CAVENDISH));

describe('OP15-006 Cavendish: +2000 with 4 or more Events in my trash', () => {
  it('printed values: cost 4, 4000, Counter +2000', () => {
    const g = board([]);
    const c = g.card(at(g, 'p1', 'characters', CAVENDISH));
    expect(c.cost).toBe(4);
    expect(c.power).toBe(4000);
  });

  it('boundary: 3 Events in the trash give nothing (4000)', () => {
    expect(pow(board(events(3)))).toBe(4000);
  });

  it('boundary: exactly 4 Events give +2000 (6000)', () => {
    expect(pow(board(events(4)))).toBe(6000);
  });

  it('more Events do not stack: 6 Events still give only +2000', () => {
    expect(pow(board(events(6)))).toBe(6000);
  });

  it('only Events count: 3 Events and 5 Characters in the trash give nothing', () => {
    expect(pow(board([...events(3), ...Array.from({ length: 5 }, () => VAN.sunny)]))).toBe(4000);
  });

  it("only my trash counts: 4 Events in the opponent's trash give nothing", () => {
    expect(pow(board(events(0), events(4)))).toBe(4000);
  });

  it('Events in my hand do not count', () => {
    expect(pow(board(events(3), [], { hand: events(3) }))).toBe(4000);
  });

  it('it is checked continuously: playing an Event that reaches 4 in the trash raises power at once', () => {
    const g = board(events(3), [], { hand: [PLAIN_MAIN_EVENT] });
    expect(pow(g)).toBe(4000);
    playRaw(g, PLAIN_MAIN_EVENT);
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'trash').filter((c) => c.card === PLAIN_MAIN_EVENT)).toHaveLength(1);
    expect(pow(g)).toBe(6000);
  });

  it('while the Event is still resolving or in hand it is not in the trash: 3 in trash + 1 in hand = 4000', () => {
    const g = board(events(3), [], { hand: [PLAIN_MAIN_EVENT] });
    expect(pow(g)).toBe(4000);
  });
});

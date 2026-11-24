/**
 * OP13-066 Silvers Rayleigh (Character, Purple, cost 8, 9000, no Counter, {Roger Pirates}, [Rush]).
 *
 * Card text: "[Rush] [On Play] If you have any DON!! cards given, rest up to 1 of your opponent's
 * Characters with a cost of 5 or less. Then, add up to 1 DON!! card from your DON!! deck and set it
 * as active at the end of this turn."
 *
 * Rules: CR 10-1-1 ([Rush]), CR 6-6-1-2 (delayed "at the end of this turn" processing), E-Q11 (the
 * count), RD 122 (CR 4-10-1: after a failed "If" the "Then" does not resolve), CR 10-1-4 (a rested
 * Character cannot block).
 * M6b-Q34 (open): when the DON!! is added is not asserted, only that it is on my field and active
 * once my turn has ended, and that nothing changed in my active DON!! during this turn.
 * Scenery: OP01-018 Hajrudin (cost 4), OP02-006 Kingdew (cost 5), OP02-007 Thatch (cost 6),
 * OP09-072 Franky (cost 4, [Blocker]).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  canHit,
  ch,
  don,
  endMyTurn,
  kind,
  LD13,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  blockers,
  act,
  type Placed,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-066';
const FRANKY = 'OP09-072';

/** 8 active DON!! for the cost, `given` DON!! on the Leader, 1 DON!! left in the DON!! deck by default. */
function play(
  o: { given?: number; active?: number; theirs?: Placed; mine?: Placed } = {},
): TestGame {
  return me(
    o.given === 0 ? LD13.plain : { card: LD13.plain, don: o.given ?? 1 },
    { hand: [ID], characters: o.mine ?? [], costArea: { active: o.active ?? 8, rested: 0 } },
    { characters: o.theirs ?? [S13.c4, S13.c5, S13.c6] },
  );
}

describe('OP13-066 Silvers Rayleigh: [Rush]; [On Play] if DON!! given, rest up to 1 Character with cost 5 or less', () => {
  it('has [Rush]: it can attack the opponent’s Leader the turn it is played', () => {
    const g = play();
    playRaw(g, ID);
    const pick = g.legal().find((a) => a.type === 'pick');
    if (pick) g.act(pick);
    else act(g, { type: 'done' });
    const ray = ch(g, 'p1', ID);
    expect(g.card(ray).keywords).toContain('Rush');
    expect(canHit(g, ray, g.leader('p2'))).toBe(true);
  });

  it('boundary: cost 4 and cost 5 are offered, cost 6 is not; the picked Character is rested', () => {
    const g = play();
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c4, S13.c5].sort());
    pickInst(g, [ch(g, 'p2', S13.c5)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(ch(g, 'p2', S13.c5)).rested).toBe(true);
    expect(g.card(ch(g, 'p2', S13.c4)).rested).toBe(false);
    expect(g.card(ch(g, 'p2', S13.c6)).rested).toBe(false);
  });

  it('only the opponent’s Characters are candidates', () => {
    const g = play({ mine: [S13.c1] });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c4, S13.c5].sort());
  });

  it('the DON!! is not added as an active DON!! during this turn (my active count does not rise)', () => {
    const g = play();
    playRaw(g, ID);
    pickInst(g, [ch(g, 'p2', S13.c4)]);
    expect(don(g).active).toBe(0);
  });

  it('once my turn has ended there is 1 more DON!! on my field, ACTIVE, taken from the DON!! deck', () => {
    const g = play();
    playRaw(g, ID);
    pickInst(g, [ch(g, 'p2', S13.c4)]);
    endMyTurn(g);
    expect(don(g)).toMatchObject({ active: 1, rested: 8, given: 1, deck: 0 });
  });

  it('"up to 1": choosing 0 at the count adds nothing', () => {
    const g = play();
    playRaw(g, ID);
    pickInst(g, [ch(g, 'p2', S13.c4)]);
    act(g, { type: 'endTurn' });
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { option: '0' } });
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ active: 0, deck: 1 });
  });

  it('with no DON!! given: nothing is rested and, after the failed "If", nothing is added at the end of the turn', () => {
    const g = play({ given: 0 });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(g.card(ch(g, 'p2', S13.c4)).rested).toBe(false);
    endMyTurn(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 8, deck: 2 });
  });

  it('"up to 1": the Character to rest may be skipped, and then no Character is rested', () => {
    const g = play();
    playRaw(g, ID);
    none(g);
    expect(g.card(ch(g, 'p2', S13.c4)).rested).toBe(false);
    expect(g.card(ch(g, 'p2', S13.c5)).rested).toBe(false);
  });

  it('with an empty DON!! deck the Character is still rested and no count is asked at the end of the turn', () => {
    const g = play({ active: 9 });
    expect(don(g).deck).toBe(0);
    playRaw(g, ID);
    pickInst(g, [ch(g, 'p2', S13.c4)]);
    expect(g.card(ch(g, 'p2', S13.c4)).rested).toBe(true);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
  });

  it('a rested [Blocker] cannot block the Rush attack that follows', () => {
    const g = play({ theirs: [FRANKY] });
    playRaw(g, ID);
    pickInst(g, [ch(g, 'p2', FRANKY)]);
    act(g, { type: 'attack', attacker: ch(g, 'p1', ID), target: g.leader('p2') });
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([]);
  });
});

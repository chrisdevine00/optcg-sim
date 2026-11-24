/**
 * OP11-007 Tashigi (Character, Red, cost 1, 1000, Counter +1000, {Navy}).
 *
 * Card text: "[Activate: Main] You may rest this Character: If your Leader has the "Navy" type, up to 1
 * of your "Navy" type Characters gains +2000 power during this turn."
 *
 * Rules: resting is the cost (CR 8-3-1); only an ACTIVE Character can pay it. The "If" is checked
 * after the cost. "Has the Navy type" reads the Leader's types. "Up to 1" may be none. The boost
 * lasts until the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  endTurn,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  useAbility,
} from './kit-op11a.ts';

const TASHIGI = 'OP11-007';

function board(
  leader: string,
  chars: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[],
) {
  return mine(leader, { characters: chars }, { characters: [N11.marco] });
}

/** Activate and say yes to a "you may rest" question if one is asked. */
function activate(g: ReturnType<typeof board>) {
  useAbility(g, at(g, 'p1', 'characters', TASHIGI));
  if (kind(g) === 'optional') g.act({ type: 'optional', accept: true, player: 'p1' });
}

describe('OP11-007 Tashigi: [Activate: Main] rest this, Navy Leader: a Navy Character +2000', () => {
  it('printed values: cost 1, 1000, Counter +1000', () => {
    const g = board(L11.koby, [TASHIGI]);
    const t = chr(g, 'p1', TASHIGI);
    expect(g.card(t).cost).toBe(1);
    expect(g.power(t)).toBe(1000);
    expect(g.card(t).counter).toBe(1000);
  });

  it('with a Navy Leader: rests Tashigi and gives the chosen Navy Character +2000', () => {
    const g = board(L11.koby, [TASHIGI, N11.navy3]);
    activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    expect(g.card(chr(g, 'p1', TASHIGI)).rested).toBe(true);
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(7000);
  });

  it('offers only Navy Characters (Tashigi herself included), not the Leader or a non-Navy Character', () => {
    const g = board(L11.koby, [TASHIGI, N11.navy3, N11.fish3]);
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TASHIGI, N11.navy3].sort());
  });

  it('Tashigi may boost herself (1000 to 3000)', () => {
    const g = board(L11.koby, [TASHIGI]);
    activate(g);
    pickInst(g, [chr(g, 'p1', TASHIGI)]);
    expect(g.power(chr(g, 'p1', TASHIGI))).toBe(3000);
  });

  it('with a non-Navy Leader nobody gets +2000', () => {
    const g = board(L11.luffy, [TASHIGI, N11.navy3]);
    if (offeredAbilities(g, chr(g, 'p1', TASHIGI)).length) {
      activate(g);
      if (kind(g) === 'choose') {
        // Whatever is asked, no Navy Character may end up boosted.
        none(g);
      }
    }
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(5000);
    expect(g.power(chr(g, 'p1', TASHIGI))).toBe(1000);
  });

  it('"up to 1": choosing nobody still rests Tashigi and changes no power', () => {
    const g = board(L11.koby, [TASHIGI, N11.navy3]);
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(chr(g, 'p1', TASHIGI)).rested).toBe(true);
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(5000);
  });

  it('a rested Tashigi cannot use it (the rest cost cannot be paid)', () => {
    const g = board(L11.koby, [{ card: TASHIGI, rested: true }, N11.navy3]);
    expect(offeredAbilities(g, chr(g, 'p1', TASHIGI))).toEqual([]);
  });

  it('after one use she is rested, so it is not offered again this turn', () => {
    const g = board(L11.koby, [TASHIGI, N11.navy3]);
    activate(g);
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, chr(g, 'p1', TASHIGI))).toEqual([]);
  });

  it('can be used the turn she is played', () => {
    const g = board(L11.koby, [{ card: TASHIGI, playedThisTurn: true }, N11.navy3]);
    expect(offeredAbilities(g, chr(g, 'p1', TASHIGI))).toHaveLength(1);
  });

  it('the +2000 lasts this turn only', () => {
    const g = board(L11.koby, [TASHIGI, N11.navy3]);
    activate(g);
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(5000);
  });
});

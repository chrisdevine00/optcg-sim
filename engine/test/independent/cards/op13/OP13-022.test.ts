/**
 * OP13-022 Windmill Village (Stage, Red, cost 1, {Windmill Village}).
 *
 * Card text: "[Activate: Main] You may rest this Stage: Up to 1 of your Characters with 2000 base
 * power or less gains +1000 power during this turn."
 *
 * Rules: CR 8-3 (the rest cost is paid to activate; a rested Stage cannot pay it again), base power
 * is the printed power (CR 2-6-3), not the current one; "up to" may be skipped (CR 8-1-2);
 * "during this turn" ends with the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  endTurn,
  L13,
  mine,
  need,
  none,
  offeredAbilities,
  offeredInsts,
  pickInst,
  playRaw,
  useAbility,
  V13,
} from './kit-op13a.ts';

const STAGE = 'OP13-022';
const DADAN = 'OP13-009'; // 2000
const HIGUMA = V13.higumaB; // ST08-008, 2000

function board(chars: string[], p2chars: string[] = [], rested = false) {
  return mine(
    L13.luffy,
    { stage: { card: STAGE, rested }, characters: chars, costArea: { active: 10, rested: 0 } },
    { characters: p2chars },
  );
}
const stage = (g: ReturnType<typeof board>) => at(g, 'p1', 'stage', STAGE);

describe('OP13-022 Windmill Village: rest this Stage, up to 1 of my Characters with 2000 base power or less gains +1000', () => {
  it('printed values: Stage, cost 1, its ability is offered in my Main Phase', () => {
    const g = mine(L13.luffy, { hand: [STAGE] });
    expect(g.card(at(g, 'p1', 'hand', STAGE)).cost).toBe(1);
    const b = board([DADAN]);
    expect(offeredAbilities(b, stage(b)).length).toBe(1);
  });

  it('activating rests the Stage and gives the chosen Character +1000', () => {
    const g = board([DADAN]);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', DADAN)]);
    need(g, 'main', 'p1');
    expect(g.card(stage(g)).rested).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', DADAN))).toBe(3000);
  });

  it('boundary: 2000 base power qualifies; 3000 and 4000 do not; a 0-power Character does', () => {
    const g = board([DADAN, V13.komachiyo, V13.sai, V13.cobra0]);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    expect(offeredInsts(g).sort()).toEqual(
      [at(g, 'p1', 'characters', DADAN), at(g, 'p1', 'characters', V13.cobra0)].sort(),
    );
  });

  it('base power, not current: a 2000-base Character with a DON!! given (3000 now) is still a legal target', () => {
    const g = board([DADAN]);
    act(g, { type: 'giveDon', target: at(g, 'p1', 'characters', DADAN) });
    expect(g.power(at(g, 'p1', 'characters', DADAN))).toBe(3000);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([at(g, 'p1', 'characters', DADAN)]);
    pickInst(g, [at(g, 'p1', 'characters', DADAN)]);
    expect(g.power(at(g, 'p1', 'characters', DADAN))).toBe(4000);
  });

  it("only my Characters: not my Leader, not the opponent's Characters even at 2000 base", () => {
    const g = board([DADAN], [HIGUMA]);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([at(g, 'p1', 'characters', DADAN)]);
    expect(offeredInsts(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": may be skipped; the Stage stays rested (the cost was paid)', () => {
    const g = board([DADAN]);
    useAbility(g, stage(g));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(stage(g)).rested).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', DADAN))).toBe(2000);
  });

  it('gives +1000 to one Character only', () => {
    const g = board([DADAN, HIGUMA]);
    useAbility(g, stage(g));
    pickInst(g, [at(g, 'p1', 'characters', DADAN)]);
    expect(g.power(at(g, 'p1', 'characters', HIGUMA))).toBe(2000);
  });

  it('a rested Stage cannot be activated; one activation per untap', () => {
    const rested = board([DADAN], [], true);
    expect(offeredAbilities(rested, stage(rested))).toEqual([]);
    const g = board([DADAN]);
    useAbility(g, stage(g));
    pickInst(g, [at(g, 'p1', 'characters', DADAN)]);
    expect(offeredAbilities(g, stage(g))).toEqual([]);
  });

  it('can be activated the turn it is played', () => {
    const g = mine(L13.luffy, {
      hand: [STAGE],
      characters: [DADAN],
      costArea: { active: 10, rested: 0 },
    });
    playRaw(g, STAGE);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, stage(g as never)).length).toBe(1);
  });

  it("+1000 lasts this turn only: back to 2000 on the opponent's turn", () => {
    const g = board([DADAN]);
    useAbility(g, stage(g));
    pickInst(g, [at(g, 'p1', 'characters', DADAN)]);
    expect(g.power(at(g, 'p1', 'characters', DADAN))).toBe(3000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p1', 'characters', DADAN))).toBe(2000);
  });
});

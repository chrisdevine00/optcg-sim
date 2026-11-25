/**
 * OP09-021 Red Force (Stage, Red, cost 2, {Red-Haired Pirates}).
 *
 * Card text: "[Activate: Main] You may rest this Stage: If your Leader has the "Red-Haired Pirates"
 * type, give up to 1 of your opponent's Characters -1000 power during this turn."
 *
 * Rules: CR 8-3-1 (cost paid first; the "If" after the colon is an effect condition), CR 8-4-4
 * ("up to"), "during this turn" ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  C9,
  choices,
  endTurn,
  kind,
  L9,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  toMyNextMain,
  useAbility,
} from './kit-op09d.ts';

const ID = 'OP09-021';

function start(o: { leader?: string; opp?: string[]; mine?: string[]; rested?: boolean } = {}) {
  return mine(
    o.leader ?? L9.rhp,
    { stage: { card: ID, rested: o.rested ?? false }, characters: o.mine ?? [] },
    { characters: o.opp ?? [C9.c4, C9.c5] },
  );
}

describe('OP09-021 Red Force: [Activate: Main] rest this Stage: if Red-Haired Pirates Leader, -1000 power', () => {
  it('printed effect: the chosen opposing Character gets -1000 power this turn and the Stage is rested', () => {
    const g = start();
    useAbility(g, g.find('p1', 'stage', ID));
    need(g, 'choose', 'p1');
    pickCards(g, [C9.c4]);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', C9.c5))).toBe(7000);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(atMain(g)).toBe(true);
  });

  it("offers only the opponent's Characters (not my Characters, not either Leader)", () => {
    const g = start({ mine: [C9.c3] });
    useAbility(g, g.find('p1', 'stage', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C9.c4, C9.c5].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('a Leader without the type: the Stage still rests (cost), but no power changes and nothing is asked', () => {
    const g = start({ leader: L9.neutral });
    useAbility(g, g.find('p1', 'stage', ID));
    expect(kind(g)).not.toBe('choose');
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": choosing nothing leaves every power unchanged, the Stage stays rested', () => {
    const g = start();
    useAbility(g, g.find('p1', 'stage', ID));
    none(g);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
    expect(g.power(g.find('p2', 'characters', C9.c5))).toBe(7000);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });

  it('exactly -1000: a 3000-power Character becomes 2000', () => {
    const g = start({ opp: [C9.c1] });
    useAbility(g, g.find('p1', 'stage', ID));
    if (kind(g) === 'choose') pickCards(g, [C9.c1]);
    expect(g.power(g.find('p2', 'characters', C9.c1))).toBe(2000);
  });

  it('with no opposing Character the Stage can still be rested and nothing happens', () => {
    const g = start({ opp: [] });
    useAbility(g, g.find('p1', 'stage', ID));
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });

  it('the reduction ends with the turn', () => {
    const g = start();
    useAbility(g, g.find('p1', 'stage', ID));
    pickCards(g, [C9.c4]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
  });

  it('a rested Stage cannot be activated', () => {
    const g = start({ rested: true });
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
  });

  it('it becomes available again on my next turn (the Stage is set active in my Refresh Phase)', () => {
    const g = start();
    useAbility(g, g.find('p1', 'stage', ID));
    pickCards(g, [C9.c4]);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toEqual([]);
    toMyNextMain(g);
    expect(offeredAbilities(g, g.find('p1', 'stage', ID))).toHaveLength(1);
  });

  it('two uses on different turns do not stack beyond their own turn: after the next turn the Character is back at full power', () => {
    const g = start();
    useAbility(g, g.find('p1', 'stage', ID));
    pickCards(g, [C9.c4]);
    toMyNextMain(g);
    expect(g.power(g.find('p2', 'characters', C9.c4))).toBe(6000);
  });
});

/**
 * EB04-012 Kikunojo (Character, cost 7, 8000, no Counter, {Land of Wano}/{The Akazaya Nine}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If this Character was played on this turn, set your
 * {Land of Wano} type Leader as active."
 *
 * Rules: CR 10-2-13 ([Once Per Turn]); the condition "was played on this turn" is read as the effect
 * resolves; the Leader must have the {Land of Wano} type; setting an active card as active changes
 * nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  endTurn,
  kind,
  LE,
  mine,
  offeredAbilities,
  playCard,
  SN,
  useAbility,
} from './kit-eb04a.ts';

const KIKU = 'EB04-012';

/** Leader rested (as after using it), Kikunojo on the field. `playedNow` = played this turn. */
function field(playedNow: boolean, leader: string = LE.wano, leaderRested = true) {
  return mine(
    { card: leader, rested: leaderRested },
    { characters: [{ card: KIKU, playedThisTurn: playedNow }] },
    { characters: [SN.c4] },
  );
}
const kiku = (g: ReturnType<typeof field>) => at(g, 'p1', 'characters', KIKU);

describe('EB04-012 Kikunojo: [Activate: Main] [Once Per Turn] if played this turn, set your {Land of Wano} Leader active', () => {
  it('printed values: cost 7, 8000', () => {
    const g = field(false);
    expect(g.card(kiku(g)).cost).toBe(7);
    expect(g.card(kiku(g)).power).toBe(8000);
  });

  it('played this turn: the rested {Land of Wano} Leader is set active', () => {
    const g = field(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    useAbility(g, kiku(g));
    expect(kind(g)).toBe('main');
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('played from hand this turn (a real play): activating it untaps the Leader', () => {
    const g = mine({ card: LE.wano, rested: true }, { hand: [KIKU] }, {});
    playCard(g, KIKU);
    expect(kind(g)).toBe('main');
    useAbility(g, kiku(g));
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('boundary: not played this turn (it was already in play): the Leader stays rested', () => {
    const g = field(false);
    if (offeredAbilities(g, kiku(g)).length) useAbility(g, kiku(g));
    expect(kind(g)).toBe('main');
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('must not happen: a Leader without the {Land of Wano} type stays rested', () => {
    const g = field(true, LE.luffy);
    if (offeredAbilities(g, kiku(g)).length) useAbility(g, kiku(g));
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('an already active {Land of Wano} Leader stays active and nothing else happens', () => {
    const g = field(true, LE.wano, false);
    if (offeredAbilities(g, kiku(g)).length) useAbility(g, kiku(g));
    expect(kind(g)).toBe('main');
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('[Once Per Turn]: not offered a second time in the same turn', () => {
    const g = field(true);
    useAbility(g, kiku(g));
    expect(offeredAbilities(g, kiku(g))).toEqual([]);
  });

  it('it sets only the Leader: a rested Character of mine stays rested', () => {
    const g = mine(
      { card: LE.wano, rested: true },
      {
        characters: [
          { card: KIKU, playedThisTurn: true },
          { card: SN.shinobu, rested: true },
        ],
      },
      {},
    );
    useAbility(g, kiku(g));
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', SN.shinobu)).rested).toBe(true);
  });

  it('the next turn it was no longer played "this turn": the Leader (rested again) stays rested', () => {
    const g = mine(
      { card: LE.wano, rested: true },
      { characters: [{ card: KIKU, playedThisTurn: true }] },
      { characters: [SN.c4] },
    );
    endTurn(g);
    endTurn(g);
    // New turn: the Leader was set active in the Refresh Phase; rest it again by attacking.
    const l = g.leader('p1');
    g.act({ type: 'attack', attacker: l, target: g.leader('p2') });
    g.act({ type: 'block', blocker: null });
    while (kind(g) === 'counter') g.act({ type: 'endCounter' });
    while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.card(l).rested).toBe(true);
    if (offeredAbilities(g, kiku(g)).length) useAbility(g, kiku(g));
    expect(g.card(l).rested).toBe(true);
  });
});

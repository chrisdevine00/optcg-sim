/**
 * OP18-032 Buggy (Green Character, cost 5, 6000, {East Blue}/{Buggy Pirates}).
 *
 * Card text (cards/data):
 *   "[On Play]/[On K.O.] Up to 1 of your opponent's rested Characters with 8000 power or less will not
 *    become active in your opponent's next Refresh Phase."
 *
 * Reading: [On Play] and [On K.O.] both: pick up to 1 RESTED opposing Character with current power
 * 8000 or less; it skips the opponent's next Refresh Phase (stays rested through their next turn).
 *
 * Scenery: OP02-007 Thatch (8000), OP02-020 LittleOars Jr. (9000), OP02-006 Kingdew (7000).
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import {
  at,
  atMain,
  endBattle,
  LC,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playCard,
  theirs,
  VC,
  type Chars,
} from './kit-c.ts';

const BUGGY = 'OP18-032';

function onPlay(oppChars: (string | { card: string; rested?: boolean })[]) {
  const g = mine(LC.luffy, { hand: [BUGGY] }, { characters: oppChars });
  playCard(g, BUGGY);
  return g;
}

describe('OP18-032 Buggy: [On Play] a rested opposing Character (8000 or less) skips its next Refresh', () => {
  it('only rested Characters with 8000 power or less are offered (8000 boundary in, 9000 out, active out)', () => {
    const g = onPlay([
      { card: VC.thatch6, rested: true },
      { card: VC.oars7, rested: true },
      { card: VC.kingdew5, rested: false },
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VC.thatch6]);
  });

  it('the chosen Character is still rested after the opponent’s next Refresh Phase', () => {
    const g = onPlay([{ card: VC.thatch6, rested: true }]);
    pickCards(g, [VC.thatch6]);
    act(g, { type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(true);
  });

  it('control: an unchosen rested Character does untap in the same Refresh Phase', () => {
    const g = onPlay([
      { card: VC.thatch6, rested: true },
      { card: VC.kingdew5, rested: true },
    ]);
    pickCards(g, [VC.thatch6]);
    act(g, { type: 'endTurn' });
    expect(g.card(at(g, 'p2', 'characters', VC.kingdew5)).rested).toBe(false);
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(true);
  });

  it('it skips only one Refresh: untapped after the following turn', () => {
    const g = onPlay([{ card: VC.thatch6, rested: true }]);
    pickCards(g, [VC.thatch6]);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(false);
  });

  it('"up to 1": may choose nothing', () => {
    const g = onPlay([{ card: VC.thatch6, rested: true }]);
    none(g);
    act(g, { type: 'endTurn' });
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(false);
  });

  it('with no legal target nothing is asked', () => {
    const g = onPlay([{ card: VC.oars7, rested: true }, VC.kingdew5]);
    expect(atMain(g)).toBe(true);
  });
});

describe('OP18-032 Buggy: [On K.O.] the same effect', () => {
  /** p2's Thatch (8000) K.O.'s p1's rested Buggy (6000); Thatch is rested by attacking. */
  function ko(extra: Chars = []) {
    const g = theirs(
      LC.luffy,
      { characters: [{ card: BUGGY, rested: true }] },
      { characters: [VC.thatch6, ...(extra ?? [])] },
    );
    attack(g, at(g, 'p2', 'characters', VC.thatch6), at(g, 'p1', 'characters', BUGGY));
    endBattle(g);
    return g;
  }

  it('the opposing attacker, now rested, can be held down through its next Refresh', () => {
    const g = ko();
    need(g, 'choose', 'p1');
    pickCards(g, [VC.thatch6]);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(true);
  });

  it('only rested Characters: an active one is not offered', () => {
    const g = ko([VC.kingdew5]);
    expect(offeredIds(g)).toEqual([VC.thatch6]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = ko();
    none(g);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(g.card(at(g, 'p2', 'characters', VC.thatch6)).rested).toBe(false);
  });
});

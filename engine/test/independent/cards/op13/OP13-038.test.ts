/**
 * OP13-038 Gum-Gum Elephant Gun (Event, Green, cost 2, {Straw Hat Crew}/{Supernovas}).
 *
 * Card text: "[Main] Rest up to 1 of your opponent's Characters with a cost of 5 or less. Then, set
 * up to 2 of your DON!! cards as active at the end of this turn."
 * "[Trigger] Rest up to 1 of your opponent's Characters with a cost of 5 or less."
 *
 * Rules: CR 8-4-4-1 ("up to"), "Then" continues whether or not the first part changed anything
 * (the first part is "up to", not an "if"), digest 55 (given DON!! cannot be set), digest 72
 * (delayed "at the end of this turn" processing).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  answerCount,
  BLUE,
  choices,
  dons,
  endTurn,
  isMain,
  mine,
  need,
  offeredIds,
  optionLabels,
  pickInst,
  playRaw,
  theirs,
  attack,
  noDefence,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const GUN = 'OP13-038';

function board(oppChars: string[], active = 5, rested = 5, mineChars: string[] = []): TestGame {
  return mine(
    WL.shanks,
    { hand: [GUN], costArea: { active, rested }, characters: mineChars },
    { characters: oppChars },
  );
}

describe('OP13-038 Gum-Gum Elephant Gun: [Main] rest a cost 5 or less Character, DON!! back at end of turn', () => {
  it('offers exactly the opposing Characters with cost 5 or less (5 yes, 6 no)', () => {
    const g = board([WV.kingdew, WV.thatch, WV.marco]);
    playRaw(g, GUN);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([WV.kingdew, WV.marco].sort());
  });

  it('rests the chosen Character, and only it', () => {
    const g = board([WV.kingdew, WV.marco]);
    playRaw(g, GUN);
    pickInst(g, [g.find('p2', 'characters', WV.kingdew)]);
    expect(g.card(g.find('p2', 'characters', WV.kingdew)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(false);
    expect(isMain(g)).toBe(true);
  });

  it('my own Characters are not offered', () => {
    const g = board([WV.marco], 5, 5, [WV.mohji]);
    playRaw(g, GUN);
    expect(choices(g)).not.toContain(g.find('p1', 'characters', WV.mohji));
    expect(offeredIds(g)).toEqual([WV.marco]);
  });

  it('DON!! are not set active at once: only at the end of the turn', () => {
    const g = board([WV.marco]);
    playRaw(g, GUN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    expect(dons(g)).toMatchObject({ active: 3, rested: 7 });
    endTurn(g);
    answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(dons(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('"up to 2": with only one rested DON!! left after the cost, only one is set', () => {
    const g = board([WV.marco], 3, 0);
    playRaw(g, GUN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    expect(dons(g)).toMatchObject({ active: 1, rested: 2 });
    endTurn(g);
    answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(dons(g)).toMatchObject({ active: 3, rested: 0 });
  });

  it('never more than 2 are set, even with many rested', () => {
    const g = board([WV.marco], 2, 8);
    playRaw(g, GUN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    endTurn(g);
    expect(optionLabels(g)).toEqual(['2 DON!!', '1 DON!!', 'None']);
    answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(dons(g)).toMatchObject({ active: 2, rested: 8 });
  });

  it('"up to 2": at the end of the turn the player may set only 1, or None', () => {
    const g = board([WV.marco]);
    playRaw(g, GUN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    endTurn(g);
    answerCount(g, 1);
    need(g, 'main', 'p2');
    expect(dons(g)).toMatchObject({ active: 4, rested: 6 });
    const h = board([WV.marco]);
    playRaw(h, GUN);
    pickInst(h, [h.find('p2', 'characters', WV.marco)]);
    endTurn(h);
    answerCount(h, 0);
    need(h, 'main', 'p2');
    expect(dons(h)).toMatchObject({ active: 3, rested: 7 });
  });

  it('"Then": choosing no target still sets the DON!! at the end of the turn', () => {
    const g = board([WV.marco]);
    playRaw(g, GUN);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(false);
    endTurn(g);
    answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(dons(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('with no legal target (only a cost-6 Character) the DON!! are still set at the end', () => {
    const g = board([WV.thatch]);
    playRaw(g, GUN);
    if (!isMain(g)) {
      need(g, 'choose', 'p1');
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(g.card(g.find('p2', 'characters', WV.thatch)).rested).toBe(false);
    endTurn(g);
    answerCount(g, 2);
    need(g, 'main', 'p2');
    expect(dons(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('[Trigger]: rests up to 1 Character with cost 5 or less and sets no DON!!', () => {
    const g = theirs(
      WL.croc,
      { life: [GUN, BLUE, BLUE, BLUE], costArea: { active: 0, rested: 4 } },
      { characters: [WV.thatch, WV.kingdew, WV.jil] },
    );
    attack(g, g.find('p2', 'characters', WV.thatch), g.leader('p1'));
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([WV.jil, WV.kingdew].sort());
    pickInst(g, [g.find('p2', 'characters', WV.jil)]);
    expect(g.card(g.find('p2', 'characters', WV.jil)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', WV.kingdew)).rested).toBe(false);
    noDefence(g);
    expect(dons(g)).toMatchObject({ active: 0, rested: 4 });
  });
});

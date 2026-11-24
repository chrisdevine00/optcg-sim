/**
 * EB04-008 Distorted Future (Event, cost 1, {Bonney Pirates}/{Egghead}).
 *
 * Card text: "[Main] If you have 2 or less Life cards, give up to 1 of your opponent's Characters
 * −3000 power during this turn.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-4-4-1 ("up to"), the condition is checked as the effect resolves, "during this turn"
 * ends at the end of the turn, "during this battle" ends with the battle, an Event is trashed after
 * resolving even when its effect does nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  BLUE,
  cardIds,
  canCounterNow,
  choices,
  endTurn,
  fill,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  SN,
  theirs,
  trash,
  p2attacks,
} from './kit-eb04a.ts';

const DF = 'EB04-008';

function main(life: number, p2chars: string[] = [SN.c4, SN.c6]) {
  return mine(LE.luffy, { hand: [DF], life: fill(BLUE, life) }, { characters: p2chars });
}

describe('EB04-008 Distorted Future: [Main] with 2 or less Life, an opposing Character gets -3000', () => {
  it('printed values: Event, cost 1', () => {
    const g = main(2);
    expect(g.card(g.find('p1', 'hand', DF)).cost).toBe(1);
  });

  it('2 Life cards: -3000 on the chosen opposing Character this turn; the other is untouched; the Event is trashed', () => {
    const g = main(2);
    playRaw(g, DF);
    const target = at(g, 'p2', 'characters', SN.c6);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', SN.c4))).toBe(6000);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([DF]);
  });

  it('boundary: 3 Life cards: the condition fails, no target is asked and nothing changes (the Event is still spent)', () => {
    const g = main(3);
    playRaw(g, DF);
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p2', 'characters', SN.c6))).toBe(8000);
    expect(g.power(at(g, 'p2', 'characters', SN.c4))).toBe(6000);
    expect(trash(g)).toEqual([DF]);
  });

  it('boundary: 1 Life card works', () => {
    const g = main(1);
    playRaw(g, DF);
    pickInst(g, [at(g, 'p2', 'characters', SN.c4)]);
    expect(g.power(at(g, 'p2', 'characters', SN.c4))).toBe(3000);
  });

  it('boundary: 0 Life cards ("2 or less") works', () => {
    const g = main(0);
    playRaw(g, DF);
    pickInst(g, [at(g, 'p2', 'characters', SN.c4)]);
    expect(g.power(at(g, 'p2', 'characters', SN.c4))).toBe(3000);
  });

  it('only opposing Characters can be chosen (no Leader, none of mine), and "up to 1" allows choosing nobody', () => {
    const g = mine(
      LE.luffy,
      { hand: [DF], life: fill(BLUE, 2), characters: [SN.c2] },
      { characters: [SN.c4] },
    );
    playRaw(g, DF);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c4]);
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', SN.c4))).toBe(6000);
  });

  it('the -3000 lasts this turn only', () => {
    const g = main(2);
    playRaw(g, DF);
    const target = at(g, 'p2', 'characters', SN.c6);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(5000);
    endTurn(g);
    expect(g.power(target)).toBe(8000);
  });

  it("a Character reduced to 0 or less by it is not K.O.'d by the effect itself", () => {
    const g = main(2, [SN.c1]);
    playRaw(g, DF);
    const target = at(g, 'p2', 'characters', SN.c1);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(0);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SN.c1]);
  });
});

describe('EB04-008 Distorted Future: [Counter] my Leader +3000 during this battle', () => {
  function defending(life = 4) {
    const g = theirs(
      LE.luffy,
      {
        hand: [DF],
        life: fill(BLUE, life),
        costArea: { active: 3, rested: 0 },
        characters: [SN.c2],
      },
      { characters: [SN.c5] },
    );
    return g;
  }

  it('Leader 5000 +3000 = 8000 beats a 7000 attacker: no Life is lost; works regardless of the Life count', () => {
    const g = defending(4);
    p2attacks(g, SN.c5);
    passBlock(g);
    const ev = g.find('p1', 'hand', DF);
    expect(canCounterNow(g, ev)).toBe(true);
    activateCounter(g, ev);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([DF]);
  });

  it('the boost ends with the battle', () => {
    const g = defending(4);
    p2attacks(g, SN.c5);
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', DF));
    g.act({ type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not happen: it boosts the Leader only, not my attacked Character', () => {
    const g = theirs(
      LE.luffy,
      {
        hand: [DF],
        life: fill(BLUE, 4),
        costArea: { active: 3, rested: 0 },
        characters: [{ card: SN.c2, rested: true }],
      },
      { characters: [SN.c5] },
    );
    p2attacks(g, SN.c5, at(g, 'p1', 'characters', SN.c2));
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', DF));
    expect(g.power(at(g, 'p1', 'characters', SN.c2))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });
});

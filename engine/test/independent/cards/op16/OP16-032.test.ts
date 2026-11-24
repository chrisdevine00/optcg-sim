/**
 * OP16-032 Boa Hancock (Character, Green, cost 7, 9000, no Counter, {Kuja Pirates}/{The Seven
 * Warlords of the Sea}/{Impel Down}, Special, [Unblockable]).
 *
 * Card text: "[Unblockable] [On Play] Up to 1 of your opponent's Characters other than
 * [Monkey.D.Luffy] cannot be rested until the end of your opponent's next End Phase."
 *
 * Rules: CR 10-1-6 ([Unblockable]: the opponent cannot activate [Blocker] against it), "up to 1"
 * (CR 8-4-4-1), "cannot be rested" stops effects from resting the Character, duration "until the end
 * of your opponent's next End Phase" = CR 6-6-1-2 of the opponent's turn (RL-11). Scenery:
 * OP16-037 Mr.3 (an {Impel Down} Leader makes its [On Play] rest a Character with cost 5 or less),
 * OP09-072 Franky ([Blocker]), P-061 Monkey.D.Luffy (10000).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  choices,
  endTurn,
  kw,
  mayChooseNone,
  mine,
  need,
  none,
  OL,
  OV,
  offeredIds,
  pickInst,
  playCard,
  restedChar,
  act,
  noDefence,
} from './kit-op16a.ts';

const HANCOCK = 'OP16-032';
const MR3 = 'OP16-037';
const LUFFY_P = 'P-061'; // Monkey.D.Luffy, Green, cost 8, 10000, vanilla
const LUFFY_15 = 'OP16-015'; // Monkey.D.Luffy, Red, cost 4, 6000
const FRANKY_BLK = 'OP09-072'; // Franky, Purple, cost 4, 5000, [Blocker]
const TARGET = OV.sai4; // cost 2, 4000

function start(p2chars: string[], inHand: string[] = []) {
  const g = mine(OL.impel, { hand: [HANCOCK, ...inHand] }, { characters: p2chars });
  playCard(g, HANCOCK);
  return g;
}
/** Mr.3 is played and tries to rest `card`; returns whether the Character is rested afterwards. */
function mr3Rests(g: ReturnType<typeof start>, card: string): boolean {
  playCard(g, MR3);
  const inst = at(g, 'p2', 'characters', card);
  if (choices(g).includes(inst)) pickInst(g, [inst]);
  else if (g.legal().some((a) => a.type === 'done')) none(g);
  return restedChar(g, 'p2', card);
}

describe('OP16-032 Boa Hancock: [Unblockable]', () => {
  it('has [Unblockable]', () => {
    const g = mine(OL.impel, { characters: [HANCOCK] });
    expect(kw(g, at(g, 'p1', 'characters', HANCOCK))).toContain('Unblockable');
  });

  it("the opponent's [Blocker] cannot block it", () => {
    const g = mine(OL.impel, { characters: [HANCOCK] }, { characters: [FRANKY_BLK] });
    attack(g, at(g, 'p1', 'characters', HANCOCK), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('control: a Character without [Unblockable] can be blocked by the same [Blocker]', () => {
    const g = mine(OL.impel, { characters: [OV.hajrudin6] }, { characters: [FRANKY_BLK] });
    attack(g, at(g, 'p1', 'characters', OV.hajrudin6), g.leader('p2'));
    expect(blockers(g)).toEqual([at(g, 'p2', 'characters', FRANKY_BLK)]);
  });
});

describe('OP16-032 Boa Hancock: [On Play] an opposing Character cannot be rested', () => {
  it("offers the opponent's Characters but not a [Monkey.D.Luffy] (any card with that name), the Leader, or mine", () => {
    const g = mine(
      OL.impel,
      { hand: [HANCOCK], characters: [OV.komachiyo3] },
      { characters: [TARGET, LUFFY_P, LUFFY_15] },
    );
    playCard(g, HANCOCK);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TARGET]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('control: without the effect Mr.3 rests that Character', () => {
    const g = mine(OL.impel, { hand: [MR3] }, { characters: [TARGET] });
    playCard(g, MR3);
    pickInst(g, [at(g, 'p2', 'characters', TARGET)]);
    expect(restedChar(g, 'p2', TARGET)).toBe(true);
  });

  it('the chosen Character cannot be rested by an effect this turn', () => {
    const g = start([TARGET], [MR3]);
    pickInst(g, [at(g, 'p2', 'characters', TARGET)]);
    expect(mr3Rests(g, TARGET)).toBe(false);
  });

  it('only the chosen Character is protected: another opposing Character can still be rested', () => {
    const g = start([TARGET, OV.komachiyo3], [MR3]);
    pickInst(g, [at(g, 'p2', 'characters', TARGET)]);
    expect(mr3Rests(g, OV.komachiyo3)).toBe(true);
    expect(restedChar(g, 'p2', TARGET)).toBe(false);
  });

  it('"up to 1": may choose nothing, and then nothing is protected', () => {
    const g = start([TARGET], [MR3]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(mr3Rests(g, TARGET)).toBe(true);
  });

  it("the protection lasts through the opponent's turn and is over on my next turn", () => {
    const g = start([TARGET], [MR3]);
    pickInst(g, [at(g, 'p2', 'characters', TARGET)]);
    endTurn(g);
    expect(atMain(g, 'p2')).toBe(true);
    act(g, { type: 'endTurn' });
    expect(atMain(g, 'p1')).toBe(true);
    expect(mr3Rests(g, TARGET)).toBe(true);
  });

  it('a [Monkey.D.Luffy] is not protected: Mr.3 can rest it (cost 5 or less: Luffy OP16-015 has cost 4)', () => {
    const g = start([LUFFY_15], [MR3]);
    expect(atMain(g)).toBe(true);
    expect(mr3Rests(g, LUFFY_15)).toBe(true);
  });

  it('the Leader and my own Characters are unaffected: Hancock does not stop resting my own Character by attacking', () => {
    const g = mine(
      OL.impel,
      { hand: [HANCOCK], characters: [OV.hajrudin6] },
      { characters: [TARGET] },
    );
    playCard(g, HANCOCK);
    pickInst(g, [at(g, 'p2', 'characters', TARGET)]);
    attack(g, at(g, 'p1', 'characters', OV.hajrudin6), g.leader('p2'));
    noDefence(g);
    expect(restedChar(g, 'p1', OV.hajrudin6)).toBe(true);
  });
});

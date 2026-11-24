/**
 * OP02-013 Portgas.D.Ace (Character, Red, cost 7, 7000, no Counter, {Whitebeard Pirates}).
 *
 * Card text: "[On Play] Give up to 2 of your opponent's Characters -3000 power during this turn. Then,
 * if your Leader's type includes "Whitebeard Pirates", this Character gains [Rush] during this
 * turn."
 *
 * Rules: "up to 2" allows 0, 1 or 2 targets (CR 8-4-4-1); "during this turn" ends in the End Phase
 * (CR 6-6-1-3); "Then, if ..." is its own condition: it is checked even when the first part did
 * nothing (CR 4-10-2) and fails only when the Leader's type does not include the text (M6b-Q13,
 * CR 8-3-3); [Rush] lets a Character attack on the turn it is played (CR 10-1-1-1).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  canHit,
  choices,
  kind,
  kw,
  mayChooseNone,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  pickInst,
  playCardRaw,
  pw,
  SL,
} from './kit-stb5a.ts';

const ID = 'OP02-013';
const WB_LEADER = 'OP02-001'; // Edward.Newgate, Red, 6000, 6 Life, {The Four Emperors}/{Whitebeard Pirates}
const WB_LEADER2 = 'OP03-001'; // Portgas.D.Ace, Red, 5000, {Whitebeard Pirates}
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000
const SAI = 'OP01-012'; // Red, 4000
const HAJ = 'OP01-018'; // Red, 6000

function played(leader: string, p2chars: string[] = [KING, MARCO], mineChars: string[] = []) {
  const g = mine(
    leader,
    { hand: [ID], characters: mineChars, costArea: { active: 10, rested: 0 } },
    { characters: p2chars },
  );
  playCardRaw(g, ID);
  return g;
}

describe("OP02-013 Portgas.D.Ace: [On Play] up to 2 of the opponent's Characters get -3000 this turn", () => {
  it("offers only the opponent's Characters (not their Leader, not mine)", () => {
    const g = played(SL.luffy, [KING, MARCO], [SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KING, MARCO].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('two chosen Characters both get -3000', () => {
    const g = played(SL.luffy);
    pickInst(g, [g.find('p2', 'characters', KING), g.find('p2', 'characters', MARCO)]);
    expect(pw(g, 'p2', KING)).toBe(4000);
    expect(pw(g, 'p2', MARCO)).toBe(2000);
  });

  it('"up to 2": one Character is enough, the other is untouched', () => {
    const g = played(SL.luffy);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    expect(pw(g, 'p2', KING)).toBe(4000);
    expect(pw(g, 'p2', MARCO)).toBe(5000);
  });

  it('"up to 2": may choose nothing', () => {
    const g = played(SL.luffy);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(pw(g, 'p2', KING)).toBe(7000);
    expect(pw(g, 'p2', MARCO)).toBe(5000);
  });

  it('with three candidates no more than two can be chosen', () => {
    const g = played(SL.luffy, [KING, MARCO, HAJ]);
    pickInst(g, [g.find('p2', 'characters', KING), g.find('p2', 'characters', MARCO)]);
    expect(pw(g, 'p2', HAJ)).toBe(6000);
    expect(kind(g)).toBe('main');
  });

  it('the reduction lasts all turn (also after the effect resolved) and ends with the turn', () => {
    const g = played(SL.luffy);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    expect(pw(g, 'p2', KING)).toBe(4000);
    act(g, { type: 'endTurn' });
    expect(pw(g, 'p2', KING)).toBe(7000);
  });

  it('a 4000-power Character falls to 1000', () => {
    const g = played(SL.luffy, [SAI]);
    pickInst(g, [g.find('p2', 'characters', SAI)]);
    expect(pw(g, 'p2', SAI)).toBe(1000);
  });

  it('with no opposing Character the effect finds no target and does nothing', () => {
    const g = played(SL.luffy, []);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
  });
});

describe('OP02-013 Portgas.D.Ace: then, with a {Whitebeard Pirates} Leader, [Rush] this turn', () => {
  it('with a Whitebeard Pirates Leader Ace gains [Rush] and may attack the Leader on the turn played', () => {
    const g = played(WB_LEADER);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    const ace = g.find('p1', 'characters', ID);
    expect(kw(g, ace)).toContain('Rush');
    expect(canHit(g, ace, g.leader('p2'))).toBe(true);
  });

  it('works for another Leader with the type too (a single-type Whitebeard Pirates Leader)', () => {
    const g = played(WB_LEADER2);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Rush');
  });

  it('with a Leader without the type (Straw Hat Crew) there is no [Rush] and no attack', () => {
    const g = played(SL.luffy);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    const ace = g.find('p1', 'characters', ID);
    expect(kw(g, ace)).not.toContain('Rush');
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === ace)).toBe(false);
  });

  it('the [Rush] does not depend on choosing targets: choosing nobody still grants it', () => {
    const g = played(WB_LEADER);
    none(g);
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Rush');
  });

  it('with no opposing Character the [Rush] is still granted', () => {
    const g = played(WB_LEADER, []);
    if (kind(g) === 'choose') none(g);
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Rush');
  });

  it('[Rush] lasts this turn only: on my next turn Ace has no [Rush]', () => {
    const g = played(WB_LEADER);
    none(g);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(kw(g, g.find('p1', 'characters', ID))).not.toContain('Rush');
  });

  it('the attack with the lowered target: a 7000 Ace hits a rested 7000 Character after -3000 and wins easily', () => {
    const g = mine(
      WB_LEADER,
      { hand: [ID], costArea: { active: 10, rested: 0 } },
      { characters: [{ card: KING, rested: true }] },
    );
    playCardRaw(g, ID);
    pickInst(g, [g.find('p2', 'characters', KING)]);
    attack(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', KING));
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });
});

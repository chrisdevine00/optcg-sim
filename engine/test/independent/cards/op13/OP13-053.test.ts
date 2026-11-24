/**
 * OP13-053 Marshall.D.Teach (Character, Blue, cost 4, 5000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[When Attacking] You may trash 1 of your Characters with a type including "Whitebeard
 * Pirates": Draw 1 card and this Character gains [Banish] during this turn."
 *
 * Rules: CR 8-3-1 (cost before the colon), digest 109 (a trashed Character is not K.O.'d), CR
 * 6-5-5-4 (DON!! given to a Character return to the cost area rested), digest 96 ([Banish]: the
 * Life card is trashed, no [Trigger]), digest 72 (a "during this turn" effect ends in the End
 * Phase). Teach is itself a {Whitebeard Pirates} Character, so the cost can always be paid.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  choices,
  dons,
  handOf,
  isMain,
  kind,
  mine,
  need,
  no,
  noDefence,
  offeredIds,
  pickInst,
  toMyNextMain,
  WL,
  WV,
  yes,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const TEACH = 'OP13-053';
const CURIEL = 'OP13-044';

function board(
  chars: (string | { card: string; don: number })[],
  p2Life: string[] = [BLUE, BLUE, BLUE, BLUE],
  costArea = { active: 10, rested: 0 },
): TestGame {
  return mine(
    WL.croc,
    { characters: [TEACH, ...chars], deck: [WV.marco, WV.sai, BLUE, BLUE, BLUE], costArea },
    { life: p2Life },
  );
}

function swing(g: TestGame): void {
  attack(g, g.find('p1', 'characters', TEACH), g.leader('p2'));
}

const teachKeywords = (g: TestGame) => g.card(g.find('p1', 'characters', TEACH)).keywords;

describe('OP13-053 Marshall.D.Teach: [When Attacking] trash a {Whitebeard Pirates} Character: draw 1, gain [Banish]', () => {
  it('offers a "you may" cost question when attacking', () => {
    const g = board([WV.thatch]);
    swing(g);
    need(g, 'optional', 'p1');
  });

  it('accept: trash a chosen {Whitebeard Pirates} Character, draw 1, gain [Banish]', () => {
    const g = board([WV.thatch]);
    swing(g);
    yes(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', WV.thatch)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([WV.thatch]);
    expect(handOf(g)).toEqual([WV.marco]);
    expect(teachKeywords(g)).toContain('Banish');
  });

  it('decline: nothing is trashed, nothing is drawn, no [Banish]', () => {
    const g = board([WV.thatch]);
    swing(g);
    no(g);
    expect(g.zone('p1', 'trash')).toEqual([]);
    expect(handOf(g)).toEqual([]);
    expect(teachKeywords(g)).not.toContain('Banish');
  });

  it('candidates: my Characters with a type including the words (Former / Allies count), not others', () => {
    const g = board([WV.thatch, WV.marco, WV.doma, WV.mohji]);
    swing(g);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TEACH, WV.thatch, WV.marco, WV.doma].sort());
    expect(offeredIds(g)).not.toContain(WV.mohji);
  });

  it('with [Banish] the damaged Life card is trashed: its [Trigger] never gets a chance', () => {
    const g = board([WV.thatch], [WV.carrot, BLUE, BLUE, BLUE]);
    swing(g);
    yes(g);
    pickInst(g, [g.find('p1', 'characters', WV.thatch)]);
    noDefence(g);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([WV.carrot]);
    expect(handOf(g, 'p2')).toEqual([]);
    expect(g.life('p2')).toBe(3);
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('control: declined, the same hit adds the Life card to the hand (or offers its [Trigger])', () => {
    const g = board([WV.thatch], [WV.carrot, BLUE, BLUE, BLUE]);
    swing(g);
    no(g);
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: false });
    expect(handOf(g, 'p2')).toEqual([WV.carrot]);
    expect(g.zone('p2', 'trash')).toEqual([]);
  });

  it('[Banish] lasts this turn only', () => {
    const g = board([WV.thatch]);
    swing(g);
    yes(g);
    pickInst(g, [g.find('p1', 'characters', WV.thatch)]);
    noDefence(g);
    expect(teachKeywords(g)).toContain('Banish');
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(teachKeywords(g)).not.toContain('Banish');
  });

  it('the trashed Character is not K.O.d: Curiel [On K.O.] does not draw', () => {
    const g = board([CURIEL]);
    swing(g);
    yes(g);
    pickInst(g, [g.find('p1', 'characters', CURIEL)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([CURIEL]);
    expect(handOf(g)).toEqual([WV.marco]); // only Teach's own draw
  });

  it('DON!! given to the trashed Character return to the cost area rested', () => {
    const g = board([{ card: WV.thatch, don: 2 }], undefined, { active: 6, rested: 2 });
    const before = dons(g);
    swing(g);
    yes(g);
    pickInst(g, [g.find('p1', 'characters', WV.thatch)]);
    expect(dons(g).given).toBe(0);
    expect(dons(g).rested).toBe(before.rested + 2);
  });

  it('Teach may trash himself as the cost: he leaves and I still draw 1', () => {
    const g = board([]);
    swing(g);
    yes(g);
    if (kind(g) === 'choose') pickInst(g, [g.find('p1', 'characters', TEACH)]);
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([TEACH]);
    expect(handOf(g)).toEqual([WV.marco]);
    void choices;
  });

  it('does not fire when another Character attacks', () => {
    const g = board([WV.thatch]);
    attack(g, g.find('p1', 'characters', WV.thatch), g.leader('p2'));
    expect(kind(g)).toBe('block');
  });
});

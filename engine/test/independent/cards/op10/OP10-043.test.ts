/**
 * OP10-043 Moocy (Character, Blue, cost 2, 2000, Counter +2000, {Animal}/{Dressrosa}).
 *
 * Card text: "[On Play] You may rest 1 of your "Dressrosa" type Leader or Stage cards: Up to 1 of your
 * [Monkey.D.Luffy] Characters gains [Banish] during this turn."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), CR 8-1-2 ("up to" may be skipped), CR 10-1-... [Banish] (the Life
 * card damaged by a Banish card is trashed, no [Trigger]), "during this turn" (CR 6-6-1-2) ends at the
 * end of the turn, a name in square brackets means the exact card name.
 * Scenery: ST08-011 Monkey.D.Luffy (cost 3, 5000, named [Monkey.D.Luffy]); EB01-040 Kyros as the
 * {Dressrosa} Leader.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, noDefence } from '../../helpers.ts';
import {
  C10,
  doneRaw,
  expectMain,
  inst,
  kw,
  L10,
  mine,
  mustBeUnpayable,
  need,
  offeredNow,
  pickRaw,
  playRaw,
  STAGE_OTHER,
  X10,
  zoneIds,
} from './kit-op10b.ts';

const MOOCY = 'OP10-043';
const LUFFY = C10.luffyChar;

function start(chars: string[] = [LUFFY], leader: string = L10.dressrosa, stage?: string) {
  return mine(leader, { hand: [MOOCY], characters: chars, ...(stage ? { stage } : {}) }, {});
}
const hasBanish = (g: ReturnType<typeof start>, card: string, nth = 0) =>
  kw(g, inst(g, 'p1', 'characters', card, nth)).includes('Banish');

describe('OP10-043 Moocy: [On Play] rest my {Dressrosa} Leader or Stage: [Monkey.D.Luffy] gains [Banish] this turn', () => {
  it('accepting rests the Leader and the [Monkey.D.Luffy] Character gains [Banish]', () => {
    const g = start();
    expect(hasBanish(g, LUFFY)).toBe(false);
    playRaw(g, MOOCY);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p1', 'characters', LUFFY));
    expectMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hasBanish(g, LUFFY)).toBe(true);
  });

  it('only [Monkey.D.Luffy] Characters are offered: Moocy itself and other Characters are not', () => {
    const g = start([LUFFY, C10.marco]);
    playRaw(g, MOOCY);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([LUFFY]);
  });

  it('"up to 1": choosing nobody still pays the cost and grants nothing', () => {
    const g = start();
    playRaw(g, MOOCY);
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    doneRaw(g);
    expectMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hasBanish(g, LUFFY)).toBe(false);
  });

  it('"you may": declining leaves the Leader active and grants nothing', () => {
    const g = start();
    playRaw(g, MOOCY);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expectMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hasBanish(g, LUFFY)).toBe(false);
  });

  it('only one of two [Monkey.D.Luffy] Characters gains [Banish]', () => {
    const g = start([LUFFY, LUFFY]);
    playRaw(g, MOOCY);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, inst(g, 'p1', 'characters', LUFFY, 0));
    expectMain(g);
    const banish = g
      .zone('p1', 'characters')
      .filter((c) => c.card === LUFFY && c.keywords.includes('Banish'));
    expect(banish).toHaveLength(1);
  });

  it("[Banish] lasts this turn only: it is gone during the opponent's turn", () => {
    const g = start();
    playRaw(g, MOOCY);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, inst(g, 'p1', 'characters', LUFFY));
    expect(hasBanish(g, LUFFY)).toBe(true);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(hasBanish(g, LUFFY)).toBe(false);
  });

  it('with the [Banish] a hit on the Leader trashes the Life card instead of adding it to the hand', () => {
    const g = start();
    playRaw(g, MOOCY);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, inst(g, 'p1', 'characters', LUFFY));
    const handBefore = g.zone('p2', 'hand').length;
    attack(g, inst(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
    expect(g.zone('p2', 'hand')).toHaveLength(handBefore);
    expect(g.zone('p2', 'trash')).toHaveLength(1);
  });

  it('control: without the effect the same hit adds the Life card to the hand', () => {
    const g = start();
    playRaw(g, MOOCY);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    const handBefore = g.zone('p2', 'hand').length;
    attack(g, inst(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    noDefence(g);
    expect(g.zone('p2', 'hand')).toHaveLength(handBefore + 1);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('a non-{Dressrosa} Leader and no Stage: the cost cannot be paid and nothing is granted', () => {
    const g = start([LUFFY], L10.luffy);
    playRaw(g, MOOCY);
    mustBeUnpayable(g, 'p1');
    expectMain(g);
    expect(hasBanish(g, LUFFY)).toBe(false);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('a Stage without the {Dressrosa} type does not pay the cost', () => {
    const g = start([LUFFY], L10.luffy, STAGE_OTHER);
    playRaw(g, MOOCY);
    mustBeUnpayable(g, 'p1');
    expect(hasBanish(g, LUFFY)).toBe(false);
  });

  it('a {Dressrosa} Stage pays the cost with a non-{Dressrosa} Leader', () => {
    const g = start([LUFFY], L10.luffy, X10.coliseum);
    playRaw(g, MOOCY);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    if (
      g.legal().some((a) => a.type === 'pick' && a.choice === g.zone('p1', 'stage')[0]!.instance)
    ) {
      const d = need(g, 'choose', 'p1');
      if (d.purpose === 'cost') pickRaw(g, g.zone('p1', 'stage')[0]!.instance);
    }
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p1', 'characters', LUFFY));
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(hasBanish(g, LUFFY)).toBe(true);
    expect(zoneIds(g, 'p1', 'characters')).toContain(MOOCY);
  });
});

/**
 * EB04-052 Sanji (Character, Yellow, cost 4, 4000, Counter +1000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[When Attacking] This Character's base power becomes the same as your opponent's Leader
 * during this turn.
 * [On K.O.] If you have 2 or less Life cards, play up to 1 yellow Character card with 6000 power or
 * less from your hand."
 *
 * Rules: base power is the printed number (CR 4-9-2); DON!! given still adds +1000 each on the
 * owner's turn (B4T-R2, lead decision: "the same as your opponent's Leader" reads its current power, as OP16-036). "During this turn" ends at the end
 * of the turn. [On K.O.] fires on a battle K.O. too. The play comes from the hand, active, free.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chars,
  endTurn,
  fill,
  hand,
  isRestedInst,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickRaw,
  theirs,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-052';
/** OP02-001 Edward Newgate: Red Leader, 6000 power, 6 Life. [End of Your Turn] only. */
const NEWGATE = 'OP02-001';
/** EB04-056 Pacifista: Yellow, cost 1, 1000, Counter +2000. */
const PACIFISTA = 'EB04-056';
/** OP03-106 Charlotte Opera: Yellow, cost 4, 6000, vanilla (EB02-054 Sanji is scripted now). */
const YELLOW6000 = 'OP03-106';
/** EB04-051 Emet: Yellow, cost 8, 7000. */
const YELLOW7000 = 'EB04-051';
const SAI = 'OP01-012'; // Red, cost 2, 4000
const HAJ = 'OP01-018'; // Red, cost 4, 6000

describe('EB04-052 Sanji: [When Attacking] base power becomes the same as your opponent Leader this turn', () => {
  function attacking(p2Leader: string, don = 0): TestGame {
    const g = mine(
      LB.egghead,
      {
        characters: [{ card: ID, don }],
        deck: fill(BLUE, 10),
        costArea: { active: 10 - don, rested: 0 },
      },
      {},
      p2Leader,
    );
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    return g;
  }

  it('against a 6000 Leader its power is 6000 while attacking', () => {
    const g = attacking(NEWGATE);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
  });

  it('against a 5000 Leader its power is 5000 (raised from 4000)', () => {
    const g = attacking('ST01-001');
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(5000);
  });

  it('given DON!! still adds +1000 each on top of the copied base power', () => {
    const g = attacking(NEWGATE, 2);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(8000);
  });

  it('lasts for the rest of the turn and not beyond', () => {
    const g = attacking(NEWGATE);
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(4000);
  });

  it('does not apply before attacking', () => {
    const g = mine(LB.egghead, { characters: [ID] }, {}, NEWGATE);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(4000);
  });
});

describe('EB04-052 Sanji: [On K.O.] with 2 or less Life, play up to 1 yellow Character (6000 power or less) from hand', () => {
  /** p2's Hajrudin attacks the rested Sanji; p1 has `life` Life cards and `hnd` in hand. */
  function koed(life: number, hnd: string[]): TestGame {
    const g = theirs(
      LB.egghead,
      {
        characters: [{ card: ID, rested: true }],
        hand: hnd,
        life: fill(BLUE, life),
        deck: fill(BLUE, 10),
      },
      { characters: [HAJ] },
    );
    attack(g, at(g, 'p2', 'characters', HAJ), at(g, 'p1', 'characters', ID));
    passBlock(g);
    g.act({ type: 'endCounter' });
    return g;
  }

  it('offers yellow Characters of 6000 power or less only, and plays the chosen one active', () => {
    const g = koed(2, [PACIFISTA, YELLOW6000, YELLOW7000, SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PACIFISTA, YELLOW6000].sort());
    pickRaw(g, g.find('p1', 'hand', YELLOW6000));
    expect(chars(g)).toEqual([YELLOW6000]);
    expect(isRestedInst(g, at(g, 'p1', 'characters', YELLOW6000))).toBe(false);
    expect(hand(g)).toEqual([PACIFISTA, YELLOW7000, SAI].sort());
  });

  it('boundary: with exactly 2 Life cards it fires; with 3 it does not', () => {
    const g3 = koed(3, [PACIFISTA]);
    expect(kind(g3)).toBe('main');
    expect(chars(g3)).toEqual([]);
    const g2 = koed(2, [PACIFISTA]);
    need(g2, 'choose', 'p1');
  });

  it('fires with 0 Life cards too', () => {
    const g = koed(0, [PACIFISTA]);
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', PACIFISTA));
    expect(chars(g)).toEqual([PACIFISTA]);
  });

  it('"up to 1": may play nothing', () => {
    const g = koed(2, [PACIFISTA]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([PACIFISTA]);
  });

  it('with no qualifying card the pick is still asked (the hand is hidden)', () => {
    const g = koed(2, [SAI, YELLOW7000]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('Sanji himself is in the trash after the K.O.', () => {
    const g = koed(2, [PACIFISTA]);
    pickRaw(g, g.find('p1', 'hand', PACIFISTA));
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });
});

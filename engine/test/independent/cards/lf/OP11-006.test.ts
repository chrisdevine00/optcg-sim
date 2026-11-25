/**
 * OP11-006 Zephyr (Character, Red, cost 5, 6000, Counter +1000, Strike, {FILM}/{Neo Navy}).
 *
 * Card text: "[DON!! x1] [When Attacking] Give up to 1 of your opponent's <Special> attribute
 * Characters -5000 power during this turn."
 *
 * Rules: [DON!! x1] needs 1 or more DON!! given to Zephyr; [When Attacking] fires when he declares
 * an attack (any target); "up to 1" may be chosen as none (CR 8-4-4-1); only the opponent's
 * Characters with the Special attribute qualify (Leaders and my own cards do not); "during this
 * turn" ends with the turn; the lowered power is what battles read.
 * Scenery: OP09-082 Pizarro (Special, 6000), OP01-043 Shinobu (Special, 5000), OP01-023 Marco
 * (Special, 5000, mine), OP02-006 Kingdew (Strike), OP01-012 Sai (Slash), ST03-001 Crocodile
 * (Special Leader).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canFinish,
  choices,
  endTurn,
  hand,
  kind,
  LD_LF,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  pickInst,
  playRaw,
  VAN_LF,
} from './kit-lfa.ts';

const ZEPHYR = 'OP11-006';
const { pizarro, shinobu, marco, kingdew, sai } = VAN_LF;
type Ch = string | { card: string; rested?: boolean; don?: number };

/** p1 (Luffy) has Zephyr with `don` DON!! and `mineChars`; p2 (Crocodile, Special) has `theirs`. */
function board(theirs: Ch[], o: { don?: number; mineChars?: Ch[] } = {}) {
  return mine(
    LD_LF.luffy,
    {
      characters: [{ card: ZEPHYR, don: o.don ?? 1 }, ...(o.mineChars ?? [])],
      costArea: { active: 9, rested: 0 },
    },
    { characters: theirs },
    LD_LF.croc,
  );
}

function swing(g: ReturnType<typeof board>) {
  attack(g, at(g, 'p1', 'characters', ZEPHYR), g.leader('p2'));
}

describe('OP11-006 Zephyr', () => {
  it('printed values: cost 5, 6000 power (7000 with the DON!!), Counter +1000', () => {
    const g = board([]);
    const z = at(g, 'p1', 'characters', ZEPHYR);
    expect(g.card(z).cost).toBe(5);
    expect(g.card(z).counter).toBe(1000);
    expect(g.power(z)).toBe(7000);
  });

  it("when attacking with 1 DON!!: offers exactly the opponent's <Special> Characters, rested or active", () => {
    const g = board([pizarro, { card: shinobu, rested: true }, kingdew, sai]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([pizarro, shinobu].sort());
  });

  it('the chosen Character gets -5000 power during this turn', () => {
    const g = board([pizarro]);
    swing(g);
    const p = at(g, 'p2', 'characters', pizarro);
    expect(g.power(p)).toBe(6000);
    pickInst(g, [p]);
    expect(g.power(p)).toBe(1000);
  });

  it('only one Character is lowered, and no second prompt follows', () => {
    const g = board([pizarro, shinobu]);
    swing(g);
    const p = at(g, 'p2', 'characters', pizarro);
    pickInst(g, [p]);
    expect(kind(g)).not.toBe('choose');
    expect(g.power(p)).toBe(1000);
    expect(g.power(at(g, 'p2', 'characters', shinobu))).toBe(5000);
  });

  it('"up to 1": choosing nobody changes nothing', () => {
    const g = board([pizarro]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', pizarro))).toBe(6000);
  });

  it("the opponent's Leader (a Special attribute Leader) and my own Special Character are not candidates", () => {
    const g = board([pizarro], { mineChars: [marco] });
    swing(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', marco));
    expect(offeredIds(g)).toEqual([pizarro]);
  });

  it('without the DON!! the attack triggers nothing', () => {
    const g = board([pizarro], { don: 0 });
    swing(g);
    expect(kind(g)).not.toBe('choose');
    expect(g.power(at(g, 'p2', 'characters', pizarro))).toBe(6000);
  });

  it('with only non-Special Characters on the other side there is nothing to choose', () => {
    const g = board([kingdew, sai]);
    swing(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.power(at(g, 'p2', 'characters', kingdew))).toBe(7000);
    expect(g.power(at(g, 'p2', 'characters', sai))).toBe(4000);
  });

  it('it fires when attacking a rested Character as well', () => {
    const g = board([
      { card: shinobu, rested: true },
      { card: pizarro, rested: true },
    ]);
    attack(g, at(g, 'p1', 'characters', ZEPHYR), at(g, 'p2', 'characters', shinobu));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([pizarro, shinobu].sort());
  });

  it('the lowered power is what battles read: Marco (5000) now K.O.s a rested Pizarro (6000 - 5000)', () => {
    const g = board([{ card: pizarro, rested: true }], { mineChars: [marco] });
    swing(g);
    pickInst(g, [at(g, 'p2', 'characters', pizarro)]);
    noDefence(g);
    need(g, 'main', 'p1');
    attack(g, at(g, 'p1', 'characters', marco), at(g, 'p2', 'characters', pizarro));
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('"during this turn": the opponent\'s Character is back to its power on their turn', () => {
    const g = board([pizarro]);
    swing(g);
    const p = at(g, 'p2', 'characters', pizarro);
    pickInst(g, [p]);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(p)).toBe(6000);
  });

  it('must not fire on play: playing Zephyr from hand asks nothing', () => {
    const g = mine(LD_LF.luffy, { hand: [ZEPHYR] }, { characters: [pizarro] }, LD_LF.croc);
    playRaw(g, ZEPHYR);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(g.power(at(g, 'p2', 'characters', pizarro))).toBe(6000);
  });
});

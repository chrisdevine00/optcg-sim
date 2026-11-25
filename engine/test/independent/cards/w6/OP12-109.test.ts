/**
 * OP12-109 Pacifista (Character, Yellow, cost 4, 5000, Counter +1000, {Biological Weapon}/{Navy}/
 * {Egghead}).
 *
 * Card text: no effect text. "[Trigger] K.O. up to 1 of your opponent's Characters with a cost of 1
 * or less and add this card to your hand."
 *
 * Rules: a [Trigger] is activated from the Life card taken by damage; the card is added to the hand
 * only through the effect (CR 10-1-5-3: otherwise it is trashed after resolving); "up to 1" lets me
 * choose none (CR 8-4-4-1), and an "and" joins two actions of one effect, so the second still
 * resolves (CR 4-10-2); declining the [Trigger] adds the Life card to the hand as usual.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  chars,
  hand,
  kind,
  LW,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  playRaw,
  theirs,
  trash,
  V13,
  snap,
  lifeCards,
} from './kit-w6b.ts';

const PACI = 'OP12-109';
const FILL = 'OP02-060';

/** p1 (Leader ST01-001) has Pacifista on top of Life; p2's Hajrudin attacks p1's Leader. Stops at p1's [Trigger] decision. */
function hit(p2Chars: string[], life: string[] = [PACI, FILL, FILL]) {
  const g = theirs(LW.luffy, { life, hand: [] }, { characters: [V13.hajrudin, ...p2Chars] });
  attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  need(g, 'trigger', 'p1');
  return g;
}

describe('OP12-109 Pacifista: [Trigger] K.O. up to 1 Character of cost 1 or less and add this card to the hand', () => {
  it('printed values: cost 4, 5000 power, Counter +1000, no effect text', () => {
    const g = mine(LW.luffy, { characters: [PACI] });
    const c = g.card(at(g, 'p1', 'characters', PACI));
    expect(c.cost).toBe(4);
    expect(g.power(c.instance)).toBe(5000);
    expect(c.counter).toBe(1000);
  });

  it('played from the hand it has no effect: no prompt, nothing happens', () => {
    const g = mine(LW.luffy, { hand: [PACI] }, { characters: [V13.komachiyo] });
    playRaw(g, PACI);
    expect(atMain(g), snap(g)).toBe(true);
    expect(chars(g)).toEqual([PACI]);
    expect(chars(g, 'p2')).toEqual([V13.komachiyo]);
  });

  it("activated: a cost-1 Character is K.O.'d (cost 2 is not offered) and Pacifista is added to my hand", () => {
    const g = hit([V13.komachiyo, V13.sai]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.komachiyo]);
    pickCards(g, [V13.komachiyo]);
    expect(kind(g)).toBe('main');
    expect(chars(g, 'p2')).toEqual([V13.hajrudin, V13.sai].sort());
    expect(trash(g, 'p2')).toEqual([V13.komachiyo]);
    expect(hand(g)).toEqual([PACI]);
    expect(trash(g)).toEqual([]);
    expect(chars(g)).toEqual([]);
    expect(g.life('p1')).toBe(2);
  });

  it('"up to 1": with two cost-1 Characters only the chosen one is K.O.\'d', () => {
    const g = hit([V13.komachiyo, V13.komachiyo]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    pickCards(g, [V13.komachiyo]);
    expect(chars(g, 'p2')).toEqual([V13.hajrudin, V13.komachiyo].sort());
    expect(hand(g)).toEqual([PACI]);
  });

  it('"up to 1": choosing nobody still adds Pacifista to my hand', () => {
    const g = hit([V13.komachiyo]);
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g, 'p2')).toEqual([V13.hajrudin, V13.komachiyo].sort());
    expect(hand(g)).toEqual([PACI]);
    expect(kind(g)).toBe('main');
  });

  it('with no Character of cost 1 or less to K.O. it is still added to my hand', () => {
    const g = hit([V13.sai]);
    act(g, { type: 'trigger', activate: true });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([PACI]);
    expect(chars(g, 'p2')).toEqual([V13.hajrudin, V13.sai].sort());
  });

  it('declining the [Trigger]: no K.O.; the Life card is added to my hand as usual', () => {
    const g = hit([V13.komachiyo]);
    act(g, { type: 'trigger', activate: false });
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([PACI]);
    expect(chars(g, 'p2')).toEqual([V13.hajrudin, V13.komachiyo].sort());
    expect(lifeCards(g)).toEqual([FILL, FILL]);
  });

  it('the [Trigger] is not a play: Pacifista does not enter the field and is not trashed', () => {
    const g = hit([V13.komachiyo]);
    act(g, { type: 'trigger', activate: true });
    pickCards(g, [V13.komachiyo]);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toHaveLength(1);
  });

  it('the Life card is only the top one: Pacifista deeper in Life has no effect when a filler is hit', () => {
    const g = hit([V13.komachiyo], [FILL, PACI, FILL]);
    // The top Life card is a filler: its [Trigger] cannot be activated.
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([FILL]);
    expect(chars(g, 'p2')).toContain(V13.komachiyo);
  });
});

/**
 * OP18-087 Stansen (Black Character, cost 3, 4000, Counter +1000, {Giant}/{Elbaph}/{New Giant Pirates}).
 *
 * Card text: "This Character gains +12 cost.
 *             If you only have Characters with a cost of 12 or more, this Character gains +2000 power."
 *
 * Reading: "only have" is read on the owner's own Characters on the field (rested or active), this
 * one included (its own cost on the field is 15, so a lone Stansen qualifies). The opponent's
 * Characters do not matter. The condition is live: it follows Characters entering or leaving.
 * Scenery: OP18-089 Dorry (cost 4+12 = 16, 5000), OP01-023 Marco (cost 3, 5000), P-041
 * Monkey.D.Luffy (Purple, cost 10, 12000, vanilla; below 12), OP01-012 Sai (cost 2, 4000).
 */
import { describe, expect, it } from 'vitest';
import { act, at, attack, cardIds, need, passBlock, play, LDR, CH } from './kit-e.ts';
import { mineE, theirsE, X } from './kit-e.ts';

const S = X.stansen;
const DORRY = X.dorry;
const MARCO = CH.marco3;
const TEN = 'P-041';
const SAI = 'OP01-012';

const power = (g: ReturnType<typeof mineE>) => g.power(at(g, 'p1', 'characters', S));

describe('OP18-087 Stansen: +12 cost', () => {
  it('on the field its cost is 15; in hand it plays for the printed 3', () => {
    const g = mineE(LDR.luffy, { hand: [S], costArea: { active: 3, rested: 0 } });
    play(g, at(g, 'p1', 'hand', S));
    expect(g.card(at(g, 'p1', 'characters', S)).cost).toBe(15);
  });
});

describe('OP18-087 Stansen: +2000 power if you only have Characters with cost 12 or more', () => {
  it('alone on the field (its own cost is 15) it has 6000', () => {
    const g = mineE(LDR.luffy, { characters: [S] });
    expect(power(g)).toBe(6000);
  });

  it('with another Giant of cost 16 it keeps 6000', () => {
    const g = mineE(LDR.luffy, { characters: [S, DORRY] });
    expect(power(g)).toBe(6000);
  });

  it('with an ordinary cost 3 Character it has only the printed 4000', () => {
    const g = mineE(LDR.luffy, { characters: [S, MARCO] });
    expect(power(g)).toBe(4000);
  });

  it('boundary: a cost 10 Character is below 12, so the bonus is off', () => {
    const g = mineE(LDR.luffy, { characters: [S, DORRY, TEN] });
    expect(power(g)).toBe(4000);
  });

  it('a rested low-cost Character of yours still counts against the condition', () => {
    const g = mineE(LDR.luffy, { characters: [S, { card: SAI, rested: true }] });
    expect(power(g)).toBe(4000);
  });

  it('the opponent’s Characters are not looked at: a cost 2 Character of theirs changes nothing', () => {
    const g = mineE(LDR.luffy, { characters: [S] }, { characters: [SAI] });
    expect(power(g)).toBe(6000);
  });

  it('live: when the low-cost Character is K.O.’d the bonus switches on', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [S, { card: MARCO, rested: true }] },
      { characters: [CH.kingdew5] },
    );
    expect(g.power(at(g, 'p1', 'characters', S))).toBe(4000);
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), at(g, 'p1', 'characters', MARCO));
    passBlock(g);
    need(g, 'counter', 'p1');
    act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([S]);
    expect(g.power(at(g, 'p1', 'characters', S))).toBe(6000);
  });

  it('live: playing a low-cost Character switches the bonus off', () => {
    const g = mineE(LDR.luffy, {
      characters: [S],
      hand: [SAI],
      costArea: { active: 2, rested: 0 },
    });
    expect(power(g)).toBe(6000);
    play(g, at(g, 'p1', 'hand', SAI));
    expect(power(g)).toBe(4000);
  });
});

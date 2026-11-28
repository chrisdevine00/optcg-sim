/**
 * OP18-086 Goldberg (Black Character, cost 3, 4000, Counter +1000, {Giant}/{Elbaph}/{New Giant Pirates}).
 *
 * Card text: "This Character gains +12 cost.
 *             [On K.O.] K.O. up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Reading: the +12 is a continuous effect that works on the field (the card in hand costs its
 * printed 3 to play). [On K.O.] fires however Goldberg is K.O.'d (battle or effect), "up to 1"
 * allows choosing nothing, and only the opponent's Characters with a current cost of 4 or less
 * are offered.
 * Scenery: OP02-006 Kingdew (Red, cost 5, 7000), OP01-018 Hajrudin (cost 4, 6000), OP01-012 Sai
 * (cost 2, 4000), OP02-060 Mohji (cost 1, 3000).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  atMain,
  cardIds,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  play,
  mayChooseNone,
  payDonStrict,
  yes,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE, theirsE, X } from './kit-e.ts';

const G = X.goldberg;
const C4 = 'OP01-018';
const C2 = 'OP01-012';
const C5 = CH.kingdew5;

/** p2's Kingdew (7000) attacks p1's rested Goldberg (4000); p1 does not counter. */
function goldbergFalls(p1: object = {}, p2chars: string[] = [C4, C2, C5]) {
  const g = theirsE(
    LDR.luffy,
    { characters: [{ card: G, rested: true }], ...p1 },
    { characters: [C5, ...p2chars.filter((c) => c !== C5)] },
  );
  attack(g, at(g, 'p2', 'characters', C5), at(g, 'p1', 'characters', G));
  passBlock(g);
  need(g, 'counter', 'p1');
  act(g, { type: 'endCounter' });
  return g;
}

describe('OP18-086 Goldberg: +12 cost', () => {
  it('on the field its cost is 15 (printed 3 + 12)', () => {
    const g = mineE(LDR.luffy, { characters: [G] });
    expect(g.card(at(g, 'p1', 'characters', G)).cost).toBe(15);
  });

  it('in hand it is not raised: it is played for its printed 3 DON!!', () => {
    const g = mineE(LDR.luffy, { hand: [G], costArea: { active: 3, rested: 0 } });
    play(g, at(g, 'p1', 'hand', G));
    expect(cardIds(g, 'p1', 'characters')).toEqual([G]);
    expect(g.card(at(g, 'p1', 'characters', G)).cost).toBe(15);
  });

  it('with only 2 DON!! it cannot be played (printed cost 3 still applies in hand)', () => {
    const g = mineE(LDR.luffy, { hand: [G], costArea: { active: 2, rested: 0 } });
    const inst = at(g, 'p1', 'hand', G);
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === inst)).toBe(false);
  });
});

describe('OP18-086 Goldberg: [On K.O.] K.O. up to 1 of the opponent’s Characters with cost 4 or less', () => {
  it('after being K.O.’d in battle, offers only opposing Characters with cost <= 4 and K.O.s the pick', () => {
    const g = goldbergFalls();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C2, C4].sort());
    pickCards(g, [C4]);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([C2, C5].sort());
    expect(cardIds(g, 'p2', 'trash')).toEqual([C4]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([G]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('boundary: a cost 5 Character is not offered, a cost 4 Character is', () => {
    const g = goldbergFalls();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(C5);
    expect(offeredIds(g)).toContain(C4);
  });

  it('"up to 1": may choose nothing, and then nothing is K.O.’d', () => {
    const g = goldbergFalls();
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([C2, C4, C5].sort());
  });

  it('it K.O.s only one even when several qualify', () => {
    const g = goldbergFalls();
    need(g, 'choose', 'p1');
    pickCards(g, [C2]);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('with no opposing Character of cost 4 or less nothing is asked and Goldberg is simply K.O.’d', () => {
    const g = goldbergFalls({}, [C5]);
    if (!atMain(g, 'p2')) {
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([G]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([C5]);
  });

  it('does not fire when Goldberg is not K.O.’d (a 3000 attacker bounces off 4000)', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [{ card: G, rested: true }] },
      { characters: ['OP02-060', C4] },
    );
    attack(g, at(g, 'p2', 'characters', 'OP02-060'), at(g, 'p1', 'characters', G));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([G]);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual(['OP02-060', C4].sort());
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('own Characters are never offered, whatever their cost', () => {
    const g = goldbergFalls({ characters: [{ card: G, rested: true }, 'OP02-060'] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C2, C4].sort());
    expect(offeredIds(g)).not.toContain('OP02-060');
  });

  it('also fires when Goldberg is K.O.’d by an opponent’s effect (OP09-077 Gum-Gum Lightning, 4000 <= 6000)', () => {
    const g = theirsE(
      LDR.luffy,
      { characters: [G] },
      { characters: [C4], hand: ['OP09-077'] },
      'ST04-001',
    );
    play(g, at(g, 'p2', 'hand', 'OP09-077'));
    yes(g, 'p2');
    payDonStrict(g, 2);
    need(g, 'choose', 'p2');
    pickCards(g, [G]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C4]);
    pickCards(g, [C4]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([G]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });
});

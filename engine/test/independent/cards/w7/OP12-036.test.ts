/**
 * OP12-036 Roronoa Zoro (Character, Green, cost 4, 5000, Counter +1000, <Slash>, {Straw Hat Crew}
 * {Supernovas}).
 *
 * Card text: "This card in your hand cannot be played by effects. If your Leader has the <Slash>
 * attribute, this Character cannot be K.O.'d in battle by <Slash> attribute cards and gains +1000
 * power."
 *
 * Rules used: a restriction on the card in the hand bars a play by an effect, not the normal play
 * (open question M6b-Q80 only for the wording of "by effects": the normal play from the hand is
 * shared by every reading); "in battle" protection does not cover a K.O. by an effect; the Leader's
 * attribute is read from the printed list (a Leader may have two attributes); a Character can only
 * be attacked while rested.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, cardIds, decision } from '../../helpers.ts';
import {
  mine7,
  need,
  noDefence,
  offeredCards,
  S7,
  theirs7,
  done,
  canDone,
  declineTriggers,
  ids,
} from './kit-w7b.ts';
import { choices, kind } from '../kit.ts';

const ZORO = 'OP12-036';
const SLASH_LEADER = S7.slashSupernova; // OP01-001, Slash
const GIN = 'OP15-007';
const EAST_BLUE_LEADER = 'OP03-021'; // Kuro: Green, 5000, Slash, {East Blue}/{Black Cat Pirates}
const SLASH_STRIKE_LEADER = 'ST12-001'; // Slash/Strike, Blue/Green, 5000
const STRIKE_LEADER = S7.strikeSupernova; // OP01-003, Strike
const SLASH_ATTACKER = S7.vanilla8Slash; // OP12-005 Shiki, 10000, Slash
const STRIKE_ATTACKER = S7.kingdew; // OP02-006 Kingdew, 7000, Strike
const SPECIAL_ATTACKER = S7.marco; // OP01-023 Marco, 5000, Special

/** p2 attacks the rested Zoro of p1 with `attacker`; p1 neither blocks nor counters. */
function zoroIsAttacked(leader: string, attacker: string) {
  const g = theirs7(
    leader,
    { characters: [{ card: ZORO, rested: true }] },
    { characters: [attacker] },
  );
  attack(g, g.find('p2', 'characters', attacker), g.find('p1', 'characters', ZORO));
  noDefence(g);
  return g;
}

describe('OP12-036 Roronoa Zoro: cannot be played by effects from the hand; with a <Slash> Leader +1000 and no K.O. in battle by <Slash> cards', () => {
  it('printed values: Character, cost 4, 5000 power, Counter +1000', () => {
    const g = mine7(STRIKE_LEADER, { hand: [ZORO] });
    const z = g.zone('p1', 'hand')[0]!;
    expect(z.card).toBe(ZORO);
    expect(g.card(z.instance).cost).toBe(4);
    expect(g.card(z.instance).counter).toBe(1000);
  });

  it('with a <Slash> Leader on the field: 6000 power; with a non-<Slash> Leader: 5000', () => {
    const a = mine7(SLASH_LEADER, { characters: [ZORO] });
    expect(a.power(a.find('p1', 'characters', ZORO))).toBe(6000);
    const b = mine7(STRIKE_LEADER, { characters: [ZORO] });
    expect(b.power(b.find('p1', 'characters', ZORO))).toBe(5000);
  });

  it('a Leader with <Slash> as one of two attributes counts (Slash/Strike): 6000 power', () => {
    const g = mine7(SLASH_STRIKE_LEADER, { characters: [ZORO] });
    expect(g.power(g.find('p1', 'characters', ZORO))).toBe(6000);
  });

  it('the bonus follows the Leader: the opponent having a <Slash> Leader does not give it', () => {
    const g = mine7(STRIKE_LEADER, { characters: [ZORO] }, {}, SLASH_LEADER);
    expect(g.power(g.find('p1', 'characters', ZORO))).toBe(5000);
  });

  it('with a <Slash> Leader, a <Slash> attacker with more power does not K.O. the attacked Zoro', () => {
    const g = zoroIsAttacked(SLASH_LEADER, SLASH_ATTACKER);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
    expect(g.eventsOfType('CardKOd').length).toBe(0);
  });

  it('with a non-<Slash> Leader, the same <Slash> attacker K.O.s Zoro (5000 against 10000)', () => {
    const g = zoroIsAttacked(STRIKE_LEADER, SLASH_ATTACKER);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ZORO]);
  });

  it('with a <Slash> Leader, a non-<Slash> attacker (<Strike> 7000, <Special> 5000+) still K.O.s Zoro when its power is enough', () => {
    const strike = zoroIsAttacked(SLASH_LEADER, STRIKE_ATTACKER);
    expect(cardIds(strike, 'p1', 'trash')).toEqual([ZORO]);
    // Zoro has 6000 with the Leader bonus: a 5000 <Special> attacker does not K.O. it by power alone.
    const special = zoroIsAttacked(SLASH_LEADER, SPECIAL_ATTACKER);
    expect(cardIds(special, 'p1', 'characters')).toEqual([ZORO]);
  });

  it('the protection works while Zoro attacks too: a 6000 Zoro attacking a rested 10000 <Slash> Character is not K.O.d', () => {
    const g = mine7(
      SLASH_LEADER,
      { characters: [ZORO] },
      { characters: [{ card: SLASH_ATTACKER, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', ZORO), g.find('p2', 'characters', SLASH_ATTACKER));
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SLASH_ATTACKER]);
  });

  it('"in battle" only: a K.O. effect of a <Slash> card still K.O.s Zoro (ST16-004 Shanks, <Slash>, K.O. up to 1 rested Character)', () => {
    const g = theirs7(
      SLASH_LEADER,
      { characters: [{ card: ZORO, rested: true }] },
      { hand: ['ST16-004'] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', 'ST16-004') });
    // Pay the cost with the first DON!! the engine offers, then answer the [On Play] target pick.
    for (let i = 0; i < 40 && decision(g)?.player === 'p2' && kind(g) === 'choose'; i++) {
      const zoro = g.find('p1', 'characters', ZORO);
      if (choices(g).includes(zoro)) {
        act(g, { type: 'pick', choice: zoro });
        if (canDone(g)) done(g);
        break;
      }
      const p = g.legal().find((a) => a.type === 'pick');
      if (!p) break;
      g.act(p);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([ZORO]);
  });

  describe('in the hand: cannot be played by effects', () => {
    // OP15-007 Gin (Red, cost 6): [On Play] If your Leader has the {East Blue} type, play up to 1 Character card with a cost of 5 or less from your hand.
    const control = 'P-015'; // Sunny-Kun, cost 1: a legal candidate.

    it('an effect that plays a cost-5-or-less Character from the hand offers a vanilla candidate but not Zoro', () => {
      const g = mine7(EAST_BLUE_LEADER, { hand: [GIN, ZORO, control] });
      act(g, { type: 'playCard', card: g.find('p1', 'hand', GIN) });
      // Pay for the cost-7 Luffy with whatever DON!! the engine asks for.
      for (let i = 0; i < 20 && kind(g) === 'choose' && !offeredCards(g).includes(control); i++) {
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) break;
        g.act(p);
      }
      need(g, 'choose', 'p1');
      expect(offeredCards(g)).toContain(control);
      expect(offeredCards(g)).not.toContain(ZORO);
    });

    it('with Zoro as the only legal candidate the effect plays nothing and Zoro stays in the hand', () => {
      const g = mine7(EAST_BLUE_LEADER, { hand: [GIN, ZORO] });
      act(g, { type: 'playCard', card: g.find('p1', 'hand', GIN) });
      for (let i = 0; i < 20 && kind(g) === 'choose'; i++) {
        const zoro = g.find('p1', 'hand', ZORO);
        expect(choices(g)).not.toContain(zoro);
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) {
          if (canDone(g)) done(g);
          break;
        }
        g.act(p);
      }
      expect(cardIds(g, 'p1', 'hand')).toContain(ZORO);
      expect(ids(g, 'p1', 'characters')).not.toContain(ZORO);
    });

    it('a normal play from the hand is legal', () => {
      const g = mine7(SLASH_LEADER, { hand: [ZORO] });
      const zoro = g.find('p1', 'hand', ZORO);
      expect(g.legal().some((a) => a.type === 'playCard' && a.card === zoro)).toBe(true);
      act(g, { type: 'playCard', card: zoro });
      while (kind(g) === 'choose') {
        const p = g.legal().find((a) => a.type === 'pick');
        if (!p) break;
        g.act(p);
      }
      expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
      declineTriggers(g);
    });
  });
});

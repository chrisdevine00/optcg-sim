/**
 * EB05-010 Nico Robin (Leader, Green/Yellow, 5000, 4 Life, Wisdom, {Straw Hat Crew}).
 *
 * Card text: "[Once Per Turn] When one of your Characters with the "Wisdom" attribute and without
 * [Blocker] is K.O.'d, add up to 1 card from the top of your deck to the top of your Life cards.
 * [Activate: Main] [Once Per Turn] Set up to 1 of your Characters with the "Wisdom" attribute and
 * 6000 power or less as active."
 *
 * Rules: CR 2-5 (attributes), CR 10-2-17/RD 109 (K.O. is a battle or effect K.O.), CR 10-2-13,
 * CR 8-4-4-1 ("up to"), M6b-Q17 (printed values for the Blocker check).
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, fill, noDefence } from '../../helpers.ts';
import {
  abilities,
  accept,
  activate,
  BLUE,
  canActivate,
  canAttackAny,
  chars,
  choiceCards,
  choose,
  chooseNone,
  deck,
  declineAny,
  EC,
  kind,
  lifeCards,
  mine,
  offeredInstance,
  RED,
  settleYes,
  theirs,
  VAN,
} from './kit-eb05a.ts';

const ROBIN = 'EB05-010';
const TOP = VAN.hajrudin;

function defending(own: (string | { card: string; rested?: boolean })[], opp: string[]) {
  return theirs(
    ROBIN,
    { characters: own, life: fill(RED, 4), deck: [TOP, ...fill(BLUE, 10)] },
    { characters: opp },
  );
}
const rested = (card: string) => ({ card, rested: true });

describe('EB05-010 Nico Robin: [Once Per Turn] a Wisdom Character without [Blocker] is K.O.’d: top of deck to top of Life', () => {
  it('a K.O.’d Wisdom Character: the top card of the deck becomes the top Life card (4 -> 5)', () => {
    const g = defending([rested(EC.mocha)], [VAN.kingdew]);
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', EC.mocha));
    noDefence(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(TOP);
    expect(deck(g)).toHaveLength(10);
  });

  it('"up to 1": the card may be left on the deck', () => {
    const g = defending([rested(EC.mocha)], [VAN.kingdew]);
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', EC.mocha));
    noDefence(g);
    declineAny(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(11);
  });

  it('a Wisdom Character WITH [Blocker] does not trigger it', () => {
    const g = defending([rested(EC.blockerWisdom)], [VAN.kingdew]);
    attack(
      g,
      g.find('p2', 'characters', VAN.kingdew),
      g.find('p1', 'characters', EC.blockerWisdom),
    );
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
  });

  it('a Character without the Wisdom attribute does not trigger it', () => {
    const g = defending([rested(VAN.marco)], [VAN.kingdew]);
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', VAN.marco));
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
  });

  it('[Once Per Turn]: a second Wisdom Character K.O.’d in the same turn adds nothing', () => {
    const g = defending([rested(EC.mocha), rested(EC.terry)], [VAN.kingdew, VAN.thatch]);
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', EC.mocha));
    noDefence(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(5);
    attack(g, g.find('p2', 'characters', VAN.thatch), g.find('p1', 'characters', EC.terry));
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(5);
  });

  it('does not trigger when the Wisdom Character survives the battle', () => {
    const g = defending([rested(EC.mocha)], [VAN.sunny]);
    attack(g, g.find('p2', 'characters', VAN.sunny), g.find('p1', 'characters', EC.mocha));
    noDefence(g);
    expect(chars(g)).toEqual([EC.mocha]);
    expect(g.life('p1')).toBe(4);
  });

  it('an opposing Wisdom Character K.O.’d on my turn does not add to my Life', () => {
    const g = mine(
      ROBIN,
      { characters: [VAN.kingdew], life: fill(RED, 4) },
      { characters: [rested(EC.mocha)] },
    );
    attack(g, g.find('p1', 'characters', VAN.kingdew), g.find('p2', 'characters', EC.mocha));
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('with an empty deck nothing can be added', () => {
    const g = theirs(
      ROBIN,
      { characters: [rested(EC.mocha)], life: fill(RED, 4), deck: [] },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', EC.mocha));
    noDefence(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(4);
  });
});

describe('EB05-010 Nico Robin: [Activate: Main] [Once Per Turn] set a Wisdom Character with 6000 power or less as active', () => {
  function ready() {
    return mine(ROBIN, {
      characters: [
        rested(EC.mocha),
        rested(EC.thatchWisdom),
        rested(VAN.hajrudin),
        rested(EC.blockerWisdom),
      ],
    });
  }

  it('offers Wisdom Characters with 6000 power or less only (6000 yes; 8000 and non-Wisdom no)', () => {
    const g = ready();
    expect(canActivate(g, g.leader('p1'))).toBe(true);
    activate(g, g.leader('p1'));
    const offeredCards = choiceCards(g);
    expect(offeredCards).toContain(EC.mocha);
    expect(offeredCards).toContain(EC.blockerWisdom);
    expect(offeredCards).not.toContain(EC.thatchWisdom);
    expect(offeredCards).not.toContain(VAN.hajrudin);
  });

  it('the chosen Character becomes active and can attack', () => {
    const g = ready();
    const mocha = g.find('p1', 'characters', EC.mocha);
    expect(g.card(mocha).rested).toBe(true);
    activate(g, g.leader('p1'));
    choose(g, [offeredInstance(g, EC.mocha)]);
    settleYes(g, 'p1');
    expect(g.card(mocha).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', EC.thatchWisdom)).rested).toBe(true);
    expect(canAttackAny(g, mocha)).toBe(true);
  });

  it('7000 power is over the limit: a 7000 Wisdom Character is not offered', () => {
    const g = mine(ROBIN, { characters: [rested(EC.sengoku), rested(EC.mocha)] });
    activate(g, g.leader('p1'));
    expect(choiceCards(g)).toEqual([EC.mocha]);
  });

  it('"up to 1": may set nothing', () => {
    const g = ready();
    activate(g, g.leader('p1'));
    chooseNone(g);
    settleYes(g, 'p1');
    expect(g.card(g.find('p1', 'characters', EC.mocha)).rested).toBe(true);
  });

  it('[Once Per Turn]: not offered again after it resolved; offered again next turn', () => {
    const g = ready();
    activate(g, g.leader('p1'));
    choose(g, [offeredInstance(g, EC.mocha)]);
    settleYes(g, 'p1');
    expect(abilities(g, g.leader('p1'))).toEqual([]);
    endTurn(g);
    endTurn(g);
    expect(abilities(g, g.leader('p1'))).toHaveLength(1);
  });

  it('only my own Characters are candidates', () => {
    const g = mine(ROBIN, { characters: [rested(EC.mocha)] }, { characters: [rested(EC.terry)] });
    activate(g, g.leader('p1'));
    expect(choiceCards(g)).toEqual([EC.mocha]);
  });

  it('with no eligible Character the ability may still be used and does nothing', () => {
    const g = mine(ROBIN, { characters: [rested(VAN.marco)] });
    if (canActivate(g, g.leader('p1'))) {
      activate(g, g.leader('p1'));
      settleYes(g, 'p1');
    }
    expect(g.card(g.find('p1', 'characters', VAN.marco)).rested).toBe(true);
    expect(accept).toBeTruthy();
  });
});

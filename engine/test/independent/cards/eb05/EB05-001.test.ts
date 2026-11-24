/**
 * EB05-001 Jewelry Bonney (Character, Red, cost 5, 7000, {Bonney Pirates}/{Supernovas}).
 *
 * Card text: "[On Play] If your Leader has the {Supernovas} type, draw 2 cards and play up to 2
 * Character cards with 2000 power or less from your hand.
 * [Activate: Main] [Once Per Turn] Give up to 1 of your opponent's Leader or Characters with 6000
 * power or more -1000 power until the end of your opponent's next End Phase."
 *
 * Rules: CR 8-3-3 (text after a failed "if" does not resolve), CR 8-4-4-1 ("up to" allows 0),
 * CR 10-2-13 ([Once Per Turn]), RL-11 ("until the end of your opponent's next End Phase").
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  abilities,
  activate,
  BLUE,
  canActivate,
  chars,
  choiceCards,
  choices,
  choose,
  chooseNone,
  deck,
  EC,
  EL,
  hand,
  kind,
  mine,
  offeredInstance,
  p2power,
  playCard,
  reachablePickSets,
  settleYes,
  throughOpponentTurn,
  VAN,
} from './kit-eb05a.ts';

const BONNEY = 'EB05-001';

function played(leader: string = EL.supernovas, inHand: string[] = [], top: string[] = []) {
  const g = mine(leader, { hand: [BONNEY, ...inHand], deck: [...top, ...fill(BLUE, 12)] });
  playCard(g, BONNEY);
  return g;
}

describe('EB05-001 Jewelry Bonney: [On Play] Supernovas Leader: draw 2, play up to 2 Characters of 2000 power or less', () => {
  it('draws 2 cards and plays the two chosen Characters from hand', () => {
    const g = played(EL.supernovas, [EC.bege2000, EC.killer1000]);
    expect(kind(g)).toBe('choose');
    choose(g, [offeredInstance(g, EC.bege2000), offeredInstance(g, EC.killer1000)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([BONNEY, EC.bege2000, EC.killer1000].sort());
    expect(hand(g)).toEqual([BLUE, BLUE]);
    expect(deck(g)).toHaveLength(10);
  });

  it('CR 8-4-4-1: "up to 2" allows playing one or none', () => {
    const sets = reachablePickSets(played(EL.supernovas, [EC.bege2000, EC.killer1000]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(EC.bege2000)).toBe(true);
    expect(sets.has([EC.bege2000, EC.killer1000].sort().join('+'))).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('plays at most 2 even when 3 candidates are in hand', () => {
    const sets = reachablePickSets(
      played(EL.supernovas, [EC.bege2000, EC.killer1000, EC.bonney2000]),
    );
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect(sets.size).toBeGreaterThan(1);
  });

  it('power boundary: 2000 and 1000 are candidates, 3000 is not', () => {
    const g = played(EL.supernovas, [EC.bege2000, EC.killer1000, VAN.mohji]);
    expect(choiceCards(g)).toEqual([EC.bege2000, EC.killer1000].sort());
  });

  it('the cards drawn by this effect are candidates too (draw comes first)', () => {
    const g = played(EL.supernovas, [], [EC.killer1000, VAN.mohji]);
    expect(choiceCards(g)).toEqual([EC.killer1000]);
    choose(g, [offeredInstance(g, EC.killer1000)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([BONNEY, EC.killer1000].sort());
    expect(hand(g)).toEqual([VAN.mohji]);
  });

  it('CR 8-3-3: without a {Supernovas} Leader nothing is drawn and nothing is played', () => {
    const g = played(EL.croc, [EC.bege2000], [EC.killer1000, VAN.mohji]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([EC.bege2000]);
    expect(chars(g)).toEqual([BONNEY]);
    expect(deck(g)).toHaveLength(14);
  });

  it('with no candidate in hand and none drawn, the 2 cards are still drawn', () => {
    const g = played(EL.supernovas, [VAN.mohji]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([BLUE, BLUE, VAN.mohji].sort());
    expect(chars(g)).toEqual([BONNEY]);
  });

  it('may choose to play none of the candidates', () => {
    const g = played(EL.supernovas, [EC.bege2000]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([BONNEY]);
    expect(hand(g)).toContain(EC.bege2000);
  });
});

describe('EB05-001 Jewelry Bonney: [Activate: Main] [Once Per Turn] -1000 to a Leader or Character with 6000 power or more', () => {
  const OPP = [VAN.hajrudin, VAN.marco];
  function withBonney(p2Leader: string = 'ST01-001') {
    return mine(EL.croc, { characters: [BONNEY] }, { characters: OPP }, p2Leader);
  }
  const bonney = (g: ReturnType<typeof withBonney>) => g.find('p1', 'characters', BONNEY);
  const leaderOffered = (g: ReturnType<typeof withBonney>) => choices(g).includes(g.leader('p2'));

  it('gives -1000 to the chosen Character with 6000 power (boundary: 6000 yes, 5000 no)', () => {
    const g = withBonney();
    expect(canActivate(g, bonney(g))).toBe(true);
    activate(g, bonney(g));
    expect(choiceCards(g)).toContain(VAN.hajrudin);
    expect(choiceCards(g)).not.toContain(VAN.marco);
    choose(g, [offeredInstance(g, VAN.hajrudin)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.hajrudin)).toBe(5000);
    expect(p2power(g, VAN.marco)).toBe(5000);
  });

  it('the opposing Leader is a candidate when it has 6000 power or more', () => {
    const g = withBonney(EL.magellan);
    activate(g, bonney(g));
    expect(leaderOffered(g)).toBe(true);
    choose(g, [g.leader('p2')]);
    settleYes(g, 'p1');
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('the opposing Leader at 5000 power is not a candidate', () => {
    const g = withBonney();
    activate(g, bonney(g));
    expect(leaderOffered(g)).toBe(false);
  });

  it('"up to 1": may be used on nobody', () => {
    const g = withBonney();
    activate(g, bonney(g));
    chooseNone(g);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.hajrudin)).toBe(6000);
  });

  it('[Once Per Turn]: not offered again after it resolved', () => {
    const g = withBonney();
    activate(g, bonney(g));
    choose(g, [offeredInstance(g, VAN.hajrudin)]);
    settleYes(g, 'p1');
    expect(abilities(g, bonney(g))).toEqual([]);
  });

  it('own Characters and Leader are never candidates', () => {
    const g = mine(EL.croc, { characters: [BONNEY, VAN.kingdew] }, { characters: OPP });
    activate(g, bonney(g));
    expect(choiceCards(g)).not.toContain(VAN.kingdew);
    expect(choiceCards(g)).not.toContain(BONNEY);
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('lasts through the opponent’s next turn and ends at the end of their End Phase', () => {
    const g = withBonney();
    activate(g, bonney(g));
    choose(g, [offeredInstance(g, VAN.hajrudin)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.hajrudin)).toBe(5000);
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(p2power(g, VAN.hajrudin)).toBe(5000);
    endTurn(g);
    expect(p2power(g, VAN.hajrudin)).toBe(6000);
  });

  it('is usable again on the owner’s next turn (a new use)', () => {
    const g = withBonney();
    activate(g, bonney(g));
    chooseNone(g);
    settleYes(g, 'p1');
    throughOpponentTurn(g);
    expect(abilities(g, bonney(g))).toHaveLength(1);
  });
});

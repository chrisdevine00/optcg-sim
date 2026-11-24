/** EB03-029 Insolent Fool!! Stand Down!! */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import {
  activate,
  AL4,
  canPick,
  cardsIn,
  HANCOCK_CHAR,
  HANCOCK_L,
  KUJA6,
  mk,
  ALA5,
  STRIKE_L,
} from './helpers-eb03g1.ts';

const ID = 'EB03-029';
const KUJA_COST_7 = 'OP16-032'; // {Kuja Pirates}, cost 7 (its [On Play] is inert in hand)
const start = (leader: string, hand: string[] = [AL4, KUJA6, KUJA_COST_7, V.c1, ALA5]) =>
  mk({ leader, hand: [ID, ...hand], costArea: { active: 10, rested: 0 } });

describe('EB03-029 Insolent Fool!! Stand Down!! [Main]', () => {
  it('rests 4 DON!!, then with a [Boa Hancock] Leader plays an {Amazon Lily} or {Kuja Pirates} Character with a cost of 6 or less from hand', () => {
    const g = start(HANCOCK_L);
    play(g, ID);
    accept(g); // the optional rest-4 cost (CR 8-3-1-4)
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', AL4))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', KUJA6))).toBe(true); // cost 6 boundary
    expect(canPick(g, g.find('p1', 'hand', KUJA_COST_7))).toBe(false); // cost 7
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // wrong type
    expect(canPick(g, g.find('p1', 'hand', ALA5))).toBe(false); // wrong type
    pick(g, [g.find('p1', 'hand', KUJA6)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([KUJA6]);
    // The Event costs 1 and the optional cost rests 4 more.
    expect(don(g, 'p1')).toMatchObject({ rested: 5, active: 5 });
  });

  it('must not fire with a Leader that is not [Boa Hancock]: the cost is paid and nothing is played', () => {
    const g = start(STRIKE_L);
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ rested: 5 });
  });

  it('a [Boa Hancock] Character on the field is not the Leader', () => {
    const g = mk({
      leader: STRIKE_L,
      characters: [HANCOCK_CHAR],
      hand: [ID, AL4],
      costArea: { active: 10, rested: 0 },
    });
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'hand')).toEqual([AL4]);
  });

  it('declining the cost: the Event is played, nothing else happens', () => {
    const g = start(HANCOCK_L);
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, active: 9 });
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start(HANCOCK_L);
    play(g, ID);
    accept(g);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
  });

  it('with fewer than 4 DON!! left after paying the Event the cost cannot be paid', () => {
    const g = mk({
      leader: HANCOCK_L,
      hand: [ID, AL4],
      costArea: { active: 4, rested: 0 },
    });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });
});

describe('EB03-029 Insolent Fool!! Stand Down!! [Counter]', () => {
  const underAttack = (characters: string[]) => {
    const g = game(
      { leader: HANCOCK_L, hand: [ID], characters, costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    return g;
  };

  it('up to 1 of your [Boa Hancock] cards (the Leader) gains +3000 power during this battle', () => {
    const g = underAttack([HANCOCK_CHAR, V.c1]);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', HANCOCK_CHAR))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // not [Boa Hancock]
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', HANCOCK_CHAR))).toBe(8000);
  });

  it('works on a [Boa Hancock] Character too', () => {
    const g = underAttack([HANCOCK_CHAR]);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    pick(g, [g.find('p1', 'characters', HANCOCK_CHAR)]);
    expect(g.power(g.find('p1', 'characters', HANCOCK_CHAR))).toBe(11000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('no [Boa Hancock] card: a Leader with another name is not a candidate', () => {
    const g = game(
      { leader: STRIKE_L, hand: [ID], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    activate(g, g.find('p1', 'hand', ID), 'counter');
    expectDecision(g, 'counter', 'p1'); // no candidate: nothing is asked
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

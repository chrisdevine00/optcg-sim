/**
 * EB05-009 Fight and Die with Me!!! (Event, Red, cost 1, {Straw Hat Crew}/{East Blue}).
 *
 * Card text: "[Main] All of your Characters with 4000 base power or less gain +1000 power until the end
 * of your opponent's next End Phase.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 4-9 ("base" power), RL-11 ("until the end of your opponent's next End Phase"), RL-08
 * ("during this battle"), CR 7-1-3-1-2 (Event [Counter]).
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, fill, passBlock } from '../../helpers.ts';
import {
  canCounterWith,
  EC,
  EL,
  inHand,
  kind,
  mine,
  playCard,
  playEvent,
  RED,
  theirs,
  useCounter,
  VAN,
  chooseIfAsked,
} from './kit-eb05a.ts';

const FIGHT = 'EB05-009';

const mineChars = (chars: (string | { card: string; don?: number })[], p2: string[] = []) =>
  mine(
    EL.croc,
    { hand: [FIGHT], characters: chars, costArea: { active: 8, rested: 0 } },
    { characters: p2 },
  );
const pw = (g: ReturnType<typeof mineChars>, card: string) =>
  g.power(g.find('p1', 'characters', card));

describe('EB05-009 Fight and Die with Me!!!: [Main] all my Characters with 4000 base power or less gain +1000', () => {
  it('every Character with 4000 base power or less gets +1000; a 5000 one and the Leader do not', () => {
    const g = mineChars([VAN.mohji, EC.doberman2, EC.killer1000, VAN.marco]);
    playEvent(g, FIGHT);
    expect(pw(g, VAN.mohji)).toBe(4000);
    expect(pw(g, EC.doberman2)).toBe(5000);
    expect(pw(g, EC.killer1000)).toBe(2000);
    expect(pw(g, VAN.marco)).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: 4000 base is included, 5000 base is not', () => {
    const g = mineChars([EC.doberman2, VAN.marco]);
    playEvent(g, FIGHT);
    expect(pw(g, EC.doberman2)).toBe(5000);
    expect(pw(g, VAN.marco)).toBe(5000);
    expect(g.card(g.find('p1', 'characters', VAN.marco)).power).toBe(5000);
  });

  it('it is BASE power that counts: a 4000 Character holding a DON!! (5000 current) still gets +1000', () => {
    const g = mineChars([{ card: EC.doberman2, don: 1 }]);
    expect(pw(g, EC.doberman2)).toBe(5000);
    playEvent(g, FIGHT);
    expect(pw(g, EC.doberman2)).toBe(6000);
  });

  it('a 5000-base Character is not boosted even though DON!! are irrelevant to it', () => {
    const g = mineChars([{ card: VAN.marco, don: 0 }]);
    playEvent(g, FIGHT);
    expect(pw(g, VAN.marco)).toBe(5000);
  });

  it('the opponent’s Characters are not affected', () => {
    const g = mineChars([VAN.mohji], [VAN.mohji]);
    playEvent(g, FIGHT);
    expect(g.power(g.find('p2', 'characters', VAN.mohji))).toBe(3000);
    expect(pw(g, VAN.mohji)).toBe(4000);
  });

  it('lasts through the opponent’s next turn and ends at the end of their End Phase', () => {
    const g = mineChars([VAN.mohji]);
    playEvent(g, FIGHT);
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(pw(g, VAN.mohji)).toBe(4000);
    endTurn(g);
    expect(pw(g, VAN.mohji)).toBe(3000);
  });

  it('only Characters on the field when it resolves are boosted: a later Character is not', () => {
    const g = mine(EL.croc, { hand: [FIGHT, VAN.sunny], characters: [VAN.mohji] });
    playEvent(g, FIGHT);
    playCard(g, VAN.sunny);
    expect(pw(g, VAN.sunny)).toBe(3000);
    expect(pw(g, VAN.mohji)).toBe(4000);
  });

  it('with no eligible Character the Event resolves without effect', () => {
    const g = mineChars([VAN.marco]);
    playEvent(g, FIGHT);
    expect(kind(g)).toBe('main');
    expect(pw(g, VAN.marco)).toBe(5000);
  });
});

describe('EB05-009 Fight and Die with Me!!!: [Counter] my Leader gains +3000 during this battle', () => {
  function underAttack(active = 2) {
    const g = theirs(
      EL.croc,
      {
        hand: [FIGHT],
        characters: [VAN.mohji],
        costArea: { active, rested: 0 },
        life: fill(RED, 4),
      },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('the Leader goes from 5000 to 8000 and the attack no longer connects', () => {
    const g = underAttack();
    expect(kind(g)).toBe('counter');
    expect(canCounterWith(g, inHand(g, FIGHT))).toBe(true);
    useCounter(g, inHand(g, FIGHT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('only the Leader is boosted, not my Characters', () => {
    const g = underAttack();
    useCounter(g, inHand(g, FIGHT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.find('p1', 'characters', VAN.mohji))).toBe(3000);
  });

  it('the boost ends with the battle', () => {
    const g = underAttack();
    useCounter(g, inHand(g, FIGHT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Counter costs 1 DON!!: with no active DON!! it cannot be used', () => {
    const g = underAttack(0);
    expect(canCounterWith(g, inHand(g, FIGHT))).toBe(false);
  });
});

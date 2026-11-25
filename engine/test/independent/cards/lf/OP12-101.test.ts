/**
 * OP12-101 Jewelry Bonney (Character, Yellow, cost 3, 1000, Counter +1000, Special, {Bonney
 * Pirates}/{Supernovas}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Your "Supernovas" type Leader gains +1000
 * power until the end of your opponent's next turn. [Trigger] If your Leader has the {Supernovas}
 * type, play this card."
 *
 * Rules: resting Bonney is the cost (she must be active); the effect gives +1000 to my Leader only
 * if it has the type (an effect with no valid target may still be activated, QA-GR); "until the end
 * of your opponent's next turn" covers the opponent's whole next turn and no later one (RL-11);
 * several copies stack; [Trigger] with a failed condition: the activated card goes to the trash
 * (DECISIONS 2026-11-25, block 3 batch B); a declined [Trigger] adds the card to my hand.
 * Scenery: ST01-001 Luffy ({Supernovas} Leader), ST03-001 Crocodile (not), OP01-023 Marco (5000).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  act,
  at,
  attack,
  chars,
  don,
  endTurn,
  fill,
  hand,
  isRested,
  kind,
  LD_LF,
  mine,
  need,
  noDefence,
  offeredAbilities,
  passBlock,
  theirs,
  trash,
  useAbility,
  VAN_LF,
} from './kit-lfa.ts';

const BONNEY = 'OP12-101';
const { marco, mohji, sai } = VAN_LF;

describe('OP12-101 Jewelry Bonney: [Activate: Main]', () => {
  it('printed values: cost 3, 1000 power, Counter +1000', () => {
    const g = mine(LD_LF.luffy, { characters: [BONNEY] });
    const b = at(g, 'p1', 'characters', BONNEY);
    expect(g.card(b).cost).toBe(3);
    expect(g.power(b)).toBe(1000);
    expect(g.card(b).counter).toBe(1000);
  });

  it('resting her gives my {Supernovas} Leader +1000 power', () => {
    const g = mine(LD_LF.luffy, { characters: [BONNEY] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    useAbility(g, at(g, 'p1', 'characters', BONNEY));
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(isRested(g, at(g, 'p1', 'characters', BONNEY))).toBe(true);
  });

  it('the cost is only resting her: no DON!! is spent and no card is trashed', () => {
    const g = mine(LD_LF.luffy, { characters: [BONNEY], hand: [marco] });
    useAbility(g, at(g, 'p1', 'characters', BONNEY));
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
    expect(hand(g)).toEqual([marco]);
  });

  it('a rested Bonney cannot be activated', () => {
    const g = mine(LD_LF.luffy, { characters: [{ card: BONNEY, rested: true }] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', BONNEY))).toEqual([]);
  });

  it('after the use she is rested, so the ability is not offered again', () => {
    const g = mine(LD_LF.luffy, { characters: [BONNEY] });
    const b = at(g, 'p1', 'characters', BONNEY);
    useAbility(g, b);
    expect(offeredAbilities(g, b)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it("the boost lasts through the opponent's whole next turn and ends with it", () => {
    const g = mine(LD_LF.luffy, { characters: [BONNEY] });
    useAbility(g, at(g, 'p1', 'characters', BONNEY));
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the boost decides a battle on the opponent's turn: a 5000 attacker no longer hits my 6000 Leader", () => {
    const run = (boost: boolean) => {
      const g = mine(
        LD_LF.luffy,
        { characters: [BONNEY], life: fill(mohji, 4) },
        { characters: [marco] },
      );
      if (boost) useAbility(g, at(g, 'p1', 'characters', BONNEY));
      endTurn(g);
      attack(g, at(g, 'p2', 'characters', marco), g.leader('p1'));
      noDefence(g);
      return g.life('p1');
    };
    expect(run(false)).toBe(3);
    expect(run(true)).toBe(4);
  });

  it('a Leader without the "Supernovas" type: she can be rested for it but the Leader gains nothing', () => {
    const g = mine(LD_LF.croc, { characters: [BONNEY] });
    useAbility(g, at(g, 'p1', 'characters', BONNEY));
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(isRested(g, at(g, 'p1', 'characters', BONNEY))).toBe(true);
  });

  it('two Bonneys stack: +2000 on the Leader', () => {
    const g = mine(LD_LF.luffy, { characters: [BONNEY, BONNEY] });
    useAbility(g, at(g, 'p1', 'characters', BONNEY, 0));
    useAbility(g, at(g, 'p1', 'characters', BONNEY, 1));
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('must not boost a Character: my other Characters keep their power', () => {
    const g = mine(LD_LF.luffy, { characters: [BONNEY, marco] });
    useAbility(g, at(g, 'p1', 'characters', BONNEY));
    expect(g.power(at(g, 'p1', 'characters', marco))).toBe(5000);
  });
});

describe('OP12-101 Jewelry Bonney: [Trigger] if your Leader has {Supernovas}, play this card', () => {
  /** p2 attacks my Leader; the top Life card is Bonney. Stops at the trigger decision. */
  function hit(leader: string, chars: string[] = []) {
    const g = theirs(
      leader,
      { life: [BONNEY, mohji, mohji, mohji], characters: chars },
      { characters: [marco] },
    );
    attack(g, at(g, 'p2', 'characters', marco), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    return g;
  }

  it('with a {Supernovas} Leader: activating plays her (active, on the field), nothing else changes', () => {
    const g = hit(LD_LF.luffy);
    activateTrigger(g);
    expect(chars(g)).toEqual([BONNEY]);
    expect(isRested(g, at(g, 'p1', 'characters', BONNEY))).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
  });

  it('with a Leader that is not {Supernovas}: the condition fails, she is not played (she goes to the trash)', () => {
    const g = hit(LD_LF.croc);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([BONNEY]);
  });

  it('declining the [Trigger]: she goes to my hand', () => {
    const g = hit(LD_LF.luffy);
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([BONNEY]);
    expect(chars(g)).toEqual([]);
  });

  it('a Bonney played by the [Trigger] can use her [Activate: Main] on my next turn', () => {
    const g = hit(LD_LF.luffy);
    activateTrigger(g);
    endTurn(g);
    need(g, 'main', 'p1');
    const b = at(g, 'p1', 'characters', BONNEY);
    expect(offeredAbilities(g, b)).toHaveLength(1);
  });

  it('with 5 Characters already on the field I must choose one to trash to make room, then she is played', () => {
    const g = hit(LD_LF.luffy, [marco, marco, marco, marco, sai]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    const target = g.legal().find((a) => a.type === 'pick' && typeof a.choice === 'string');
    expect(target).toBeDefined();
    act(g, { type: 'pick', choice: (target as { choice: string }).choice });
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(chars(g)).toContain(BONNEY);
    expect(trash(g)).toHaveLength(1);
  });
});

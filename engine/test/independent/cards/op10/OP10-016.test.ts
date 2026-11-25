/**
 * OP10-016 Monet (Character, Red, cost 2, 3000, Counter +1000, {Donquixote Pirates}/{Punk Hazard}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Give up to 2 rested DON!! cards to your
 * Leader or 1 of your Characters. Then, give up to 1 of your opponent's Characters -1000 power
 * during this turn."
 *
 * Rules: resting Monet is the cost (an active Monet is needed); only rested DON!! of the cost area
 * can be given (CR 6-5-5, RL-35) to one Leader or Character; "give up to N DON!!" asks a count and
 * a target; the "Then" has no condition of its own, so the -1000 happens whether or not DON!! was
 * given; "up to 1" opposing Character may be none; the -1000 lasts this turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cardIds,
  countOptions,
  decision,
  don,
  endTurn,
  giveDon10,
  kind,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  useAbility,
  VAN,
} from './kit-op10a.ts';

const MONET = 'OP10-016';

/** My turn: Monet active, `rested` of 10 DON!! rested, Marco as a second Character; p2 has Kingdew. */
function board(rested = 4, monet: string | { card: string; rested: boolean } = MONET) {
  return mine(
    'ST01-001',
    { costArea: { active: 10 - rested, rested }, characters: [monet, VAN.marco] },
    { characters: [VAN.kingdew, VAN.sai] },
  );
}

const monetOf = (g: ReturnType<typeof board>) => at(g, 'p1', 'characters', MONET);

describe('OP10-016 Monet: [Activate: Main] rest this: give up to 2 rested DON!! to Leader/Character, then -1000 to an opposing Character', () => {
  it('printed values: cost 2, 3000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [MONET] });
    const c = g.find('p1', 'hand', MONET);
    expect(g.card(c).cost).toBe(2);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(3000);
  });

  it('activating rests Monet, gives 2 rested DON!! to my Leader (+2000) and -1000 to the chosen opposing Character', () => {
    const g = board();
    useAbility(g, monetOf(g));
    expect(g.card(monetOf(g)).rested).toBe(true);
    expect(giveDon10(g, 2, g.leader('p1'))).toBeGreaterThan(0);
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew]);
    expect(don(g)).toMatchObject({ rested: 2, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(6000);
    expect(kind(g)).toBe('main');
  });

  it('the DON!! may go to one of my Characters instead (both DON!! to the same one)', () => {
    const g = board();
    useAbility(g, monetOf(g));
    giveDon10(g, 2, at(g, 'p1', 'characters', VAN.marco));
    pickCards(g, [VAN.kingdew]);
    expect(g.power(at(g, 'p1', 'characters', VAN.marco))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the target may be Monet herself (she is rested by the cost, the DON!! can still be given)', () => {
    const g = board();
    useAbility(g, monetOf(g));
    giveDon10(g, 2, monetOf(g));
    pickCards(g, [VAN.kingdew]);
    expect(g.card(monetOf(g)).don).toBe(2);
  });

  it('"up to 2": may give just 1', () => {
    const g = board();
    useAbility(g, monetOf(g));
    giveDon10(g, 1, g.leader('p1'));
    pickCards(g, [VAN.kingdew]);
    expect(don(g)).toMatchObject({ rested: 3, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 2": may give none; the -1000 still happens (the Then has no condition)', () => {
    const g = board();
    useAbility(g, monetOf(g));
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['2', '1', '0']);
    g.act({ type: 'pick', choice: { option: '0' } });
    if (kind(g) === 'choose' && !countOptions(g).length && decision(g)?.min === 1) {
      // A target question may still be asked for 0 DON!!; the engine must not need an answer here.
      throw new Error('a target for 0 DON!! was asked');
    }
    pickCards(g, [VAN.kingdew]);
    expect(don(g)).toMatchObject({ rested: 4, given: 0 });
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(6000);
  });

  it('only rested DON!! are given: with 1 rested DON!! at most 1 is given', () => {
    const g = board(1);
    useAbility(g, monetOf(g));
    const opts = countOptions(g);
    if (opts.length) expect(opts).not.toContain('2');
    giveDon10(g, 1, g.leader('p1'));
    pickCards(g, [VAN.kingdew]);
    expect(don(g)).toMatchObject({ active: 9, rested: 0, given: 1 });
  });

  it('with no rested DON!! nothing is given, the -1000 still resolves; active DON!! stay active', () => {
    const g = board(0);
    useAbility(g, monetOf(g));
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const d = decision(g)!;
      if (
        d.purpose === 'target' &&
        g
          .legal()
          .some((a) => a.type === 'pick' && a.choice === at(g, 'p2', 'characters', VAN.kingdew))
      ) {
        g.act({ type: 'pick', choice: at(g, 'p2', 'characters', VAN.kingdew) });
      } else if (g.legal().some((a) => a.type === 'done')) {
        g.act({ type: 'done' });
      } else {
        g.act(g.legal().find((a) => a.type === 'pick')!);
      }
    }
    expect(don(g)).toMatchObject({ active: 10, rested: 0, given: 0 });
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(6000);
  });

  it('only opposing Characters are offered for the -1000: not my own, not a Leader', () => {
    const g = board();
    useAbility(g, monetOf(g));
    giveDon10(g, 2, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.kingdew, VAN.sai].sort());
  });

  it('"up to 1": the -1000 may go to nobody (the DON!! are still given)', () => {
    const g = board();
    useAbility(g, monetOf(g));
    giveDon10(g, 2, g.leader('p1'));
    none(g);
    expect(don(g)).toMatchObject({ given: 2 });
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it('boundary: a rested Monet cannot pay the cost: the activation is not offered', () => {
    const g = board(4, { card: MONET, rested: true });
    expect(offeredAbilities(g, monetOf(g))).toEqual([]);
  });

  it('the -1000 lasts this turn only', () => {
    const g = board();
    useAbility(g, monetOf(g));
    giveDon10(g, 2, g.leader('p1'));
    pickCards(g, [VAN.kingdew]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p2', 'characters', VAN.kingdew))).toBe(7000);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });
});

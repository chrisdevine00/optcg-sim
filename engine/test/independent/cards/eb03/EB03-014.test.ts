/**
 * EB03-014 Kuina (Character, Green, cost 2, 0 power, Counter +1000, {East Blue}/{Frost Moon Village}).
 *
 * Card text (verified override): "[Activate: Main] You may rest this Character: Give up to 2 rested
 * DON!! cards to your <Slash> attribute Leader."
 *
 * Rules: giving DON!! (CR 6-5-5): the DON!! comes rested from the cost area and is +1000 power on its
 * owner's turn; "up to 2" may be 0, 1 or 2 (M4b-4); a card has the attribute if it is one of its
 * attributes (a Leader with Slash and Strike is a <Slash> Leader).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canUseAbility,
  chr,
  decision,
  donOf,
  giveDonFlow,
  kind,
  LA,
  mine,
  offeredAbilities,
  SA,
  tryActivate,
  useYes,
} from './kit-eb03a.ts';
import { act } from '../../helpers.ts';

const KUINA = 'EB03-014';
/** ST12-001 Roronoa Zoro & Sanji: Blue/Green, 5000, 4 Life, attributes Slash and Strike. */
const SLASH_STRIKE = 'ST12-001';

function board(leader: string, active: number, rested: number, extra: string[] = []) {
  return mine(
    leader,
    { characters: [KUINA, ...extra], costArea: { active, rested } },
    { characters: [SA.sai] },
  );
}

describe('EB03-014 Kuina: printed values', () => {
  it('cost 2, 0 power, Counter +1000', () => {
    const g = board(LA.oden, 3, 2);
    const k = chr(g, 'p1', KUINA);
    expect(g.card(k).cost).toBe(2);
    expect(g.power(k)).toBe(0);
    expect(g.card(k).counter).toBe(1000);
  });
});

describe('EB03-014 Kuina: [Activate: Main] rest this Character: give up to 2 rested DON!! to your <Slash> Leader', () => {
  it('gives 2 rested DON!! to a Slash Leader: +2000 power, the cost area loses 2 rested DON!!', () => {
    const g = board(LA.oden, 3, 3);
    useYes(g, at(g, 'p1', 'characters', KUINA));
    giveDonFlow(g, 2, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(kind(g)).toBe('main');
  });

  it('the cost: Kuina is rested', () => {
    const g = board(LA.oden, 3, 2);
    const k = at(g, 'p1', 'characters', KUINA);
    useYes(g, k);
    giveDonFlow(g, 2, g.leader('p1'));
    expect(g.card(k).rested).toBe(true);
    expect(canUseAbility(g, k)).toBe(false);
  });

  it('"up to 2": 1 DON!! may be given instead of 2', () => {
    const g = board(LA.oden, 3, 3);
    useYes(g, at(g, 'p1', 'characters', KUINA));
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 2": 0 may be given (the cost is still paid)', () => {
    const g = board(LA.oden, 3, 3);
    const k = at(g, 'p1', 'characters', KUINA);
    useYes(g, k);
    // Answer whatever is asked with nothing: a count of 0, or an empty target pick.
    for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
      const d = decision(g)!;
      if (d.purpose === 'mode') {
        const none0 = d.options?.find((o) => o.id === '0' || /none/i.test(o.label));
        act(g, { type: 'pick', choice: { option: none0!.id } });
      } else act(g, { type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ rested: 3, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(k).rested).toBe(true);
  });

  it('never gives more than 2 even with 5 rested DON!! available', () => {
    const g = board(LA.oden, 2, 5);
    useYes(g, at(g, 'p1', 'characters', KUINA));
    giveDonFlow(g, 2, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 3, given: 2 });
  });

  it('only RESTED DON!! is given: with 1 rested and 4 active DON!! only 1 is given', () => {
    const g = board(LA.oden, 4, 1);
    useYes(g, at(g, 'p1', 'characters', KUINA));
    giveDonFlow(g, 2, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, given: 1 });
  });

  it('with no rested DON!! the active ones stay in the cost area', () => {
    const g = board(LA.oden, 5, 0);
    const k = at(g, 'p1', 'characters', KUINA);
    if (tryActivate(g, k)) {
      for (let i = 0; i < 3 && kind(g) === 'choose'; i++) act(g, { type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader with Slash among two attributes (Slash/Strike) is a <Slash> Leader', () => {
    const g = board(SLASH_STRIKE, 3, 2);
    useYes(g, at(g, 'p1', 'characters', KUINA));
    giveDonFlow(g, 2, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('must not happen: a non-Slash Leader (Special, Strike) receives no DON!!', () => {
    for (const leader of [LA.croc, LA.wano, LA.supernovas]) {
      const g = board(leader, 3, 3);
      const k = at(g, 'p1', 'characters', KUINA);
      if (tryActivate(g, k)) {
        for (let i = 0; i < 3 && kind(g) === 'choose'; i++) act(g, { type: 'done' });
      }
      expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 3, given: 0 });
      expect(g.power(g.leader('p1'))).toBe(5000);
    }
  });

  it('the DON!! goes to the Leader, never to a Character', () => {
    const g = board(LA.oden, 3, 3, [SA.marco]);
    useYes(g, at(g, 'p1', 'characters', KUINA));
    giveDonFlow(g, 2, g.leader('p1'));
    expect(g.power(chr(g, 'p1', SA.marco))).toBe(5000);
    expect(g.power(chr(g, 'p1', KUINA))).toBe(0);
  });

  it('a rested Kuina cannot pay the cost: the ability is not offered', () => {
    const g = mine(LA.oden, {
      characters: [{ card: KUINA, rested: true }],
      costArea: { active: 3, rested: 3 },
    });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', KUINA))).toEqual([]);
  });

  it('a Kuina played this turn can activate at once (the cost is not an attack)', () => {
    const g = mine(LA.oden, {
      characters: [{ card: KUINA, playedThisTurn: true }],
      costArea: { active: 3, rested: 3 },
    });
    expect(canUseAbility(g, at(g, 'p1', 'characters', KUINA))).toBe(true);
  });
});

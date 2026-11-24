/**
 * OP12-039 Luffy Is the Man Who Will Become the King of Pirates!!! (Event, Green, cost 3, {Straw
 * Hat Crew}).
 *
 * Card text: "[Main] Set your [Roronoa Zoro] Leader as active. [Trigger] Up to 1 of your Leader or
 * Character cards gains +1000 power during this turn."
 *
 * Rules: "[Roronoa Zoro] Leader" is a Leader card with that name (OP01-001 and OP12-020 both
 * qualify; a [Roronoa Zoro] Character does not); setting an active card active changes nothing; an
 * Event costs its printed cost in DON!! (CR 2-7-3); [Trigger] is optional, the card goes to the
 * hand when it is declined (CR 10-1-5-2); "up to 1" may be 0; "during this turn" ends with the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  chr,
  declineTrigger,
  donOf,
  kind,
  LD12,
  mine,
  need,
  none,
  noDefenceUntilTrigger,
  offeredCardIds,
  pickInst,
  playRaw,
  S12,
  side,
  sorted,
  theirTurn,
} from './kit-op12a.ts';

const EV = 'OP12-039';

function board(
  leader: string,
  leaderRested: boolean,
  chars: (string | { card: string; rested?: boolean })[] = [],
  active = 10,
) {
  return mine(
    { card: leader, rested: leaderRested },
    { hand: [EV], characters: chars, costArea: { active, rested: 0 } },
  );
}

describe('OP12-039 Luffy Is the Man...: [Main] set your [Roronoa Zoro] Leader as active', () => {
  it('printed values: Event, cost 3', () => {
    const g = board(LD12.zoro, true);
    expect(g.card(g.find('p1', 'hand', EV)).cost).toBe(3);
  });

  it('a rested [Roronoa Zoro] Leader becomes active, and the Event costs 3 DON!!', () => {
    const g = board(LD12.zoro, true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    playRaw(g, EV);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, rested: 3 });
    expect(kind(g)).toBe('main');
    expect(sorted(g, 'p1', 'trash')).toEqual([EV]);
  });

  it('the other [Roronoa Zoro] Leader (OP01-001) works too', () => {
    const g = board(LD12.zoroRed, true);
    playRaw(g, EV);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('an active Zoro Leader stays active and nothing is asked', () => {
    const g = board(LD12.zoro, false);
    playRaw(g, EV);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('must not: a rested Leader that is not [Roronoa Zoro] stays rested', () => {
    const g = board(LD12.luffy, true);
    playRaw(g, EV);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('must not: a rested [Roronoa Zoro] Character is not set active, only the Leader', () => {
    const g = board(LD12.zoro, true, [{ card: S12.zoroChar, rested: true }]);
    playRaw(g, EV);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.card(chr(g, 'p1', S12.zoroChar)).rested).toBe(true);
  });

  it('must not: other rested Characters stay rested and the [Main] gives no power', () => {
    const g = board(LD12.zoro, true, [{ card: S12.sai, rested: true }]);
    playRaw(g, EV);
    expect(g.card(chr(g, 'p1', S12.sai)).rested).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('the active Leader can attack after the [Main] (the point of the card)', () => {
    const g = board(LD12.zoro, true);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === g.leader('p1'))).toBe(false);
    playRaw(g, EV);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === g.leader('p1'))).toBe(true);
  });
});

describe('OP12-039 [Trigger]: up to 1 Leader or Character +1000 during this turn', () => {
  /** p2's turn: p1's top Life card is the Event, p1 has Zoro and a Character. */
  function hit(p1Chars: string[] = [S12.sai]) {
    const g = theirTurn(
      side(LD12.zoro, S12.mohji, {
        characters: p1Chars,
        life: [EV, S12.mohji, S12.mohji, S12.mohji],
        costArea: { active: 0, rested: 0 },
      }),
      side(LD12.luffy, S12.sunny, { costArea: { active: 10, rested: 0 } }),
    );
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    noDefenceUntilTrigger(g);
    return g;
  }

  it('the [Trigger] offers exactly the Leader and the Characters of the player', () => {
    const g = hit([S12.sai, S12.marco]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([LD12.zoro, S12.marco, S12.sai].sort());
  });

  it('+1000 goes to the chosen Character this turn, and the Event card is trashed', () => {
    const g = hit();
    activateTrigger(g);
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sorted(g, 'p1', 'trash')).toEqual([EV]);
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
  });

  it('+1000 on the Leader', () => {
    const g = hit();
    activateTrigger(g);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 1": choosing nothing gives no power', () => {
    const g = hit();
    activateTrigger(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('declining the [Trigger]: the card goes to the hand and nothing is boosted', () => {
    const g = hit();
    declineTrigger(g);
    expect(sorted(g, 'p1', 'hand')).toEqual([EV]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not: the [Trigger] does not run the [Main] (a rested Zoro Leader stays rested)', () => {
    const g = theirTurn(
      side({ card: LD12.zoro, rested: true } as unknown as string, S12.mohji, {
        life: [EV, S12.mohji, S12.mohji, S12.mohji],
        costArea: { active: 0, rested: 0 },
      }),
      side(LD12.luffy, S12.sunny, { costArea: { active: 10, rested: 0 } }),
    );
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    if (kind(g) === 'choose') none(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });
});

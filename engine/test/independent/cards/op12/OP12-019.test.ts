/**
 * OP12-019 Color of Arms Haki (Event, Red, cost 0, {Former Roger Pirates}).
 *
 * Card text: "[Main] You may give 1 active DON!! card to 1 of your [Silvers Rayleigh]: Up to 1 of
 * your Leader or Character cards gains +1000 power during this turn. [Counter] Up to 1 of your
 * Characters or [Silvers Rayleigh] gains +2000 power during this battle."
 *
 * Rules: the cost gives 1 active DON!! to a card named Silvers Rayleigh (Leader or Character); it
 * is optional, offered even when unpayable with accept illegal (DECISIONS 2026-10-29); "up to 1"
 * may be 0; "during this turn" ends with the turn; a Counter Event boosts during that battle only
 * (CR 7-1-3-1); a given DON!! is +1000 power on the owner's turn (CR 6-5-5-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canAcceptOptional,
  chr,
  decision,
  donOf,
  kind,
  LD12,
  mine,
  need,
  no,
  none,
  offeredCardIds,
  passCounter,
  pickInst,
  playRaw,
  S12,
  side,
  sorted,
  theirTurn,
  toMyNextMain,
  yes,
} from './kit-op12a.ts';

const EV = 'OP12-019';
const RAYC = S12.rayleighChar;

function main(
  chars: string[],
  p2Chars: string[] = [S12.sunny],
  active = 10,
  leader: string = LD12.rayleigh,
) {
  return mine(
    leader,
    { hand: [EV], characters: chars, costArea: { active, rested: 0 } },
    { characters: p2Chars },
  );
}

describe('OP12-019 Color of Arms Haki: [Main] give 1 DON!! to [Silvers Rayleigh]: +1000 to a Leader or Character', () => {
  it('printed values: Event, cost 0', () => {
    const g = main([]);
    expect(g.card(g.find('p1', 'hand', EV)).cost).toBe(0);
  });

  it('the optional cost is offered and paid by giving 1 active DON!! to the Leader (+1000)', () => {
    const g = main([]);
    playRaw(g, EV);
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(true);
    yes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 9, given: 1 });
  });

  it('offers exactly your Leader and your Characters, never the opponent cards', () => {
    const g = main([S12.sai, S12.marco], [S12.sunny]);
    playRaw(g, EV);
    yes(g, 'p1');
    if (kind(g) === 'choose' && !offeredCardIds(g).includes(S12.sai)) {
      // the DON!! target question comes first when a Rayleigh Character is on the field
      throw new Error('unexpected DON!! target question');
    }
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([LD12.rayleigh, S12.marco, S12.sai].sort());
  });

  it('+1000 goes to the chosen Character, and only to it', () => {
    const g = main([S12.sai, S12.marco]);
    playRaw(g, EV);
    yes(g, 'p1');
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(5000);
    expect(g.power(chr(g, 'p1', S12.marco))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(6000); // only the given DON!!
  });

  it('+1000 on the Leader stacks with the given DON!!: 5000 + 1000 + 1000', () => {
    const g = main([]);
    playRaw(g, EV);
    yes(g, 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('the +1000 ends with the turn', () => {
    const g = main([S12.sai]);
    playRaw(g, EV);
    yes(g, 'p1');
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(5000);
    toMyNextMain(g);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('"up to 1": choosing nothing still gives the DON!! (the cost) and no power', () => {
    const g = main([S12.sai]);
    playRaw(g, EV);
    yes(g, 'p1');
    none(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 9, given: 1 });
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('declining: no DON!! given, no power gained', () => {
    const g = main([S12.sai]);
    playRaw(g, EV);
    no(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 10, given: 0 });
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
    expect(kind(g)).toBe('main');
  });

  it('no active DON!!: the cost cannot be paid and accept is not available', () => {
    const g = main([S12.sai], [S12.sunny], 0);
    playRaw(g, EV);
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(false);
    no(g, 'p1');
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('no [Silvers Rayleigh] on the field: nothing happens', () => {
    const g = main([S12.sai], [S12.sunny], 10, LD12.luffy);
    playRaw(g, EV);
    if (decision(g)?.kind === 'optional') {
      expect(canAcceptOptional(g)).toBe(false);
      no(g, 'p1');
    }
    expect(donOf(g, 'p1').given).toBe(0);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('with a Rayleigh Character the DON!! can go to either Rayleigh', () => {
    const g = main([RAYC]);
    playRaw(g, EV);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([LD12.rayleigh, RAYC].sort());
  });
});

describe('OP12-019 [Counter]: up to 1 Character or [Silvers Rayleigh] +2000 during this battle', () => {
  function defend(p1Leader: string, p1Chars: string[]) {
    return theirTurn(
      side(p1Leader, S12.mohji, {
        hand: [EV],
        characters: p1Chars,
        costArea: { active: 3, rested: 0 },
      }),
      side(LD12.luffy, S12.sunny, { costArea: { active: 10, rested: 0 } }),
    );
  }

  function toCounter(g: ReturnType<typeof defend>) {
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    need(g, 'counter', 'p1');
  }

  function useEvent(g: ReturnType<typeof defend>) {
    const a = g
      .legal()
      .find(
        (x) =>
          (x.type === 'counter' || x.type === 'activate') && x.card === g.find('p1', 'hand', EV),
      );
    if (!a) throw new Error('Event cannot be used as a Counter now');
    g.act(a);
  }

  it('with a Rayleigh Leader: the Leader and Characters are offered; +2000 stops a 5000 attack', () => {
    const g = defend(LD12.rayleigh, [S12.sai]);
    toCounter(g);
    useEvent(g);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([LD12.rayleigh, S12.sai].sort());
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('with another Leader: only Characters are offered', () => {
    const g = defend(LD12.luffy, [S12.sai]);
    toCounter(g);
    useEvent(g);
    if (kind(g) === 'choose') expect(offeredCardIds(g)).toEqual([S12.sai]);
  });

  it('the boost is for this battle only', () => {
    const g = defend(LD12.rayleigh, [S12.sai]);
    toCounter(g);
    useEvent(g);
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(6000);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('"up to 1": choosing nothing boosts nothing, and the Event is still spent', () => {
    const g = defend(LD12.rayleigh, [S12.sai]);
    toCounter(g);
    useEvent(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sorted(g, 'p1', 'trash')).toEqual([EV]);
  });
});

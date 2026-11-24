/**
 * OP12-016 To Never Doubt--That Is Power! (Event, Red, cost 0, {Former Roger Pirates}).
 *
 * Card text: "[Main] You may give 2 active DON!! cards to 1 of your [Silvers Rayleigh]: Your
 * opponent cannot activate [Blocker] when the card given these DON!! cards attacks during this
 * turn. [Counter] Up to 1 of your Characters or [Silvers Rayleigh] gains +2000 power during this
 * battle."
 *
 * Rules: the Main cost gives 2 active DON!! from the cost area (CR 6-5-5-1) to a card named Silvers
 * Rayleigh (Leader or Character); it is an optional cost, offered even when unpayable with accept
 * illegal (DECISIONS 2026-10-29); the restriction names the card that was given the DON!! and
 * lasts this turn; "up to 1" may be 0; a Counter Event boosts during that battle only (CR 7-1-3-1).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  blockers,
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
  noDefence,
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

const EV = 'OP12-016';
const RAYC = S12.rayleighChar;

function main(
  chars: string[],
  p2Chars: string[] = [S12.killer],
  active = 10,
  leader: string = LD12.rayleigh,
) {
  return mine(
    leader,
    { hand: [EV], characters: chars, costArea: { active, rested: 0 } },
    { characters: p2Chars },
  );
}

/** Play the Event, accept the cost and give the DON!! to `target` (picked only when asked). */
function play(g: ReturnType<typeof main>, target: string) {
  playRaw(g, EV);
  yes(g, 'p1');
  if (kind(g) === 'choose') pickInst(g, [target]);
}

describe('OP12-016 To Never Doubt--That Is Power!: [Main] give 2 DON!! to [Silvers Rayleigh], no [Blocker] against it', () => {
  it('printed values: Event, cost 0', () => {
    const g = main([]);
    expect(g.card(g.find('p1', 'hand', EV)).cost).toBe(0);
  });

  it('the Leader Rayleigh is given 2 active DON!! (+2000) and cannot be blocked this turn', () => {
    const g = main([]);
    play(g, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ active: 8, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    // the Block Step may still be asked, but no [Blocker] can be activated
    expect(blockers(g)).toEqual([]);
  });

  it('without the Event the same Leader attack can be blocked', () => {
    const g = main([]);
    act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([chr(g, 'p2', S12.killer)]);
  });

  it('the cost offers [Silvers Rayleigh] cards only: the Leader and the Rayleigh Character, not other Characters', () => {
    const g = main([RAYC, S12.sai]);
    playRaw(g, EV);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([LD12.rayleigh, RAYC].sort());
  });

  it('given to the Rayleigh Character: that Character cannot be blocked, but the Leader still can', () => {
    const g = main([RAYC]);
    play(g, chr(g, 'p1', RAYC));
    expect(g.power(chr(g, 'p1', RAYC))).toBe(8000);
    act(g, { type: 'attack', attacker: chr(g, 'p1', RAYC), target: g.leader('p2') });
    expect(blockers(g)).toEqual([]);
    noDefence(g);
    act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([chr(g, 'p2', S12.killer)]);
  });

  it('the restriction ends with the turn: next turn the attacker can be blocked again', () => {
    const g = main([]);
    play(g, g.leader('p1'));
    toMyNextMain(g);
    act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([chr(g, 'p2', S12.killer)]);
  });

  it('only 1 active DON!!: the cost cannot be paid and accept is not available', () => {
    const g = main([], [S12.killer], 1);
    playRaw(g, EV);
    need(g, 'optional', 'p1');
    expect(canAcceptOptional(g)).toBe(false);
    no(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, given: 0 });
  });

  it('no [Silvers Rayleigh] on the field: the cost cannot be paid', () => {
    const g = main([S12.sai], [S12.killer], 10, LD12.luffy);
    playRaw(g, EV);
    if (decision(g)?.kind === 'optional') {
      expect(canAcceptOptional(g)).toBe(false);
      no(g, 'p1');
    }
    expect(donOf(g, 'p1').given).toBe(0);
    act(g, { type: 'attack', attacker: chr(g, 'p1', S12.sai), target: g.leader('p2') });
    need(g, 'block', 'p2');
  });

  it('declining the optional cost: nothing is given and the attack can be blocked', () => {
    const g = main([]);
    playRaw(g, EV);
    no(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 10, given: 0 });
    act(g, { type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    need(g, 'block', 'p2');
  });

  it('must not: the Event is trashed after use and the opponent Blocker on an unrelated attacker is unaffected', () => {
    const g = main([S12.sai]);
    play(g, g.leader('p1'));
    expect(sorted(g, 'p1', 'trash')).toEqual([EV]);
    act(g, { type: 'attack', attacker: chr(g, 'p1', S12.sai), target: g.leader('p2') });
    need(g, 'block', 'p2');
  });
});

describe('OP12-016 [Counter]: up to 1 Character or [Silvers Rayleigh] +2000 during this battle', () => {
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

  function toCounter(g: ReturnType<typeof defend>, target: string) {
    act(g, { type: 'attack', attacker: g.leader('p2'), target });
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

  it('candidates with a Rayleigh Leader: the Leader and Characters', () => {
    const g = defend(LD12.rayleigh, [S12.sai]);
    toCounter(g, g.leader('p1'));
    useEvent(g);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([LD12.rayleigh, S12.sai].sort());
  });

  it('candidates with another Leader: Characters only, the Leader is not offered', () => {
    const g = defend(LD12.luffy, [S12.sai]);
    toCounter(g, g.leader('p1'));
    useEvent(g);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([S12.sai]);
    }
  });

  it('+2000 on the Rayleigh Leader makes 7000: the 5000 attack fails and no Life is lost', () => {
    const g = defend(LD12.rayleigh, []);
    toCounter(g, g.leader('p1'));
    useEvent(g);
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('the boost lasts for this battle only', () => {
    const g = defend(LD12.rayleigh, [S12.sai]);
    toCounter(g, g.leader('p1'));
    useEvent(g);
    pickInst(g, [chr(g, 'p1', S12.sai)]);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(6000);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });

  it('"up to 1": choosing nothing boosts nothing', () => {
    const g = defend(LD12.rayleigh, [S12.sai]);
    toCounter(g, g.leader('p1'));
    useEvent(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(4000);
  });
});

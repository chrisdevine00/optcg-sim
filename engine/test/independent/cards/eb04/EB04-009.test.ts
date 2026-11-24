/**
 * EB04-009 It's My Student's Farewell. I Want It to Be Proper. (Event, cost 0, {Former Roger Pirates}).
 *
 * Card text: "[Main] You may give 1 active DON!! card to 1 of your [Silvers Rayleigh]: Give up to 1 of
 * your opponent's Characters −2000 power during this turn.
 * [Counter] Up to 1 of your Characters or [Silvers Rayleigh] gains +2000 power during this battle."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost may be declined; an unpayable cost cannot be paid), only
 * ACTIVE DON!! in the cost area can be given by this cost, "[Silvers Rayleigh]" is a card name, so
 * the Leader OP12-001 Silvers Rayleigh is also "one of your [Silvers Rayleigh]" (reading: the
 * Counter half lists "Characters or [Silvers Rayleigh]", i.e. the name covers the Leader too).
 * "up to 1" (CR 8-4-4-1).
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  canCounterNow,
  choices,
  don,
  endTurn,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  p2attacks,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  SN,
  theirs,
  trash,
  yes,
} from './kit-eb04a.ts';

const EV = 'EB04-009';

function main(
  p1: Parameters<typeof mine>[1] = {},
  leader: string = LE.luffy,
  p2chars: string[] = [SN.c5],
) {
  return mine(
    leader,
    { hand: [EV], characters: [SN.rayleigh, SN.c2], ...p1 },
    { characters: p2chars },
  );
}

/** Play the Event; if the engine asks which Rayleigh gets the DON!!, pick the first Rayleigh offered. */
function payAndTarget(g: ReturnType<typeof main>, target = SN.c5) {
  playRaw(g, EV);
  yes(g, 'p1');
  if (kind(g) === 'choose' && choices(g).includes(at(g, 'p1', 'characters', SN.rayleigh))) {
    pickInst(g, [at(g, 'p1', 'characters', SN.rayleigh)]);
  }
  if (kind(g) === 'choose') pickInst(g, [at(g, 'p2', 'characters', target)]);
}

describe('EB04-009 [Main]: give 1 active DON!! to my [Silvers Rayleigh]: opposing Character -2000', () => {
  it('printed values: Event, cost 0', () => {
    const g = main();
    expect(g.card(g.find('p1', 'hand', EV)).cost).toBe(0);
  });

  it('pays: 1 active DON!! is given to Rayleigh (+1000 on my turn), and the chosen opposing Character gets -2000', () => {
    const g = main();
    payAndTarget(g);
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 9, given: 1 });
    expect(g.card(at(g, 'p1', 'characters', SN.rayleigh)).don).toBe(1);
    expect(g.power(at(g, 'p1', 'characters', SN.rayleigh))).toBe(9000);
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(5000);
    expect(trash(g)).toEqual([EV]);
  });

  it('"you may": declining the cost gives no DON!! and no -2000', () => {
    const g = main();
    playRaw(g, EV);
    no(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 10, given: 0 });
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(7000);
  });

  it('no [Silvers Rayleigh] in play: the cost cannot be paid, "use" is not offered and nothing happens', () => {
    const g = main({ characters: [SN.c2] });
    playRaw(g, EV);
    need(g, 'optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    no(g, 'p1');
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(7000);
    expect(don(g, 'p1')).toMatchObject({ active: 10, given: 0 });
  });

  it('only ACTIVE DON!! pay: with every DON!! rested the cost cannot be paid', () => {
    const g = main({ costArea: { active: 0, rested: 5 } });
    playRaw(g, EV);
    need(g, 'optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    no(g, 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5, given: 0 });
  });

  it('boundary: exactly 1 active DON!! is enough', () => {
    const g = main({ costArea: { active: 1, rested: 4 } });
    payAndTarget(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, given: 1 });
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(5000);
  });

  it('with two [Silvers Rayleigh] the player chooses which one receives the DON!!', () => {
    const g = main({ characters: [SN.rayleigh, SN.rayleigh] });
    playRaw(g, EV);
    yes(g, 'p1');
    need(g, 'choose');
    const ids = choices(g);
    expect(ids).toHaveLength(2);
    expect(ids.every((i) => g.card(i).card === SN.rayleigh)).toBe(true);
    pickInst(g, [ids[1]!]);
    pickInst(g, [at(g, 'p2', 'characters', SN.c5)]);
    expect(g.card(ids[1]!).don).toBe(1);
    expect(g.card(ids[0]!).don).toBe(0);
  });

  it('the Leader [Silvers Rayleigh] (OP12-001) is "one of your [Silvers Rayleigh]" too (reading, see header)', () => {
    const g = main({ characters: [SN.c2] }, LE.rayleighLeader);
    playRaw(g, EV);
    need(g, 'optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    yes(g, 'p1');
    if (kind(g) === 'choose' && choices(g).includes(g.leader('p1'))) pickInst(g, [g.leader('p1')]);
    pickInst(g, [at(g, 'p2', 'characters', SN.c5)]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(5000);
  });

  it('"up to 1": after paying, choosing no target still leaves the DON!! given', () => {
    const g = main();
    playRaw(g, EV);
    yes(g, 'p1');
    if (choices(g).includes(at(g, 'p1', 'characters', SN.rayleigh))) {
      pickInst(g, [at(g, 'p1', 'characters', SN.rayleigh)]);
    }
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    expect(offeredIds(g)).toEqual([SN.c5]);
    none(g);
    expect(don(g, 'p1').given).toBe(1);
    expect(g.power(at(g, 'p2', 'characters', SN.c5))).toBe(7000);
  });

  it('the -2000 lasts this turn only and never reaches a Leader', () => {
    const g = main();
    payAndTarget(g);
    const target = at(g, 'p2', 'characters', SN.c5);
    expect(g.power(target)).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    endTurn(g);
    expect(g.power(target)).toBe(7000);
  });
});

describe('EB04-009 [Counter]: up to 1 of my Characters or [Silvers Rayleigh] gains +2000 during this battle', () => {
  function defending() {
    return theirs(
      LE.luffy,
      { hand: [EV], characters: [SN.c2, SN.rayleigh], costArea: { active: 3, rested: 0 } },
      { characters: [SN.c5] },
    );
  }

  it('a Character of mine gets +2000 during the battle; the Leader may not be chosen when it is not a Rayleigh', () => {
    const g = defending();
    p2attacks(g, SN.c5, g.leader('p1'));
    passBlock(g);
    const ev = g.find('p1', 'hand', EV);
    expect(canCounterNow(g, ev)).toBe(true);
    activateCounter(g, ev);
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([SN.c2, SN.rayleigh].sort());
    pickInst(g, [at(g, 'p1', 'characters', SN.c2)]);
    expect(g.power(at(g, 'p1', 'characters', SN.c2))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Rayleigh Leader can be boosted: 5000 + 2000 holds off a 6000 attacker', () => {
    const g = theirs(
      LE.rayleighLeader,
      { hand: [EV], characters: [SN.c2], costArea: { active: 3, rested: 0 } },
      { characters: [SN.c4] },
    );
    p2attacks(g, SN.c4, g.leader('p1'));
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', EV));
    need(g, 'choose');
    if (choices(g).includes(g.leader('p1'))) {
      pickInst(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(7000);
    } else {
      throw new Error('the Rayleigh Leader is not offered');
    }
  });

  it('the boost ends with the battle', () => {
    const g = defending();
    p2attacks(g, SN.c5, g.leader('p1'));
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', EV));
    pickInst(g, [at(g, 'p1', 'characters', SN.rayleigh)]);
    expect(g.power(at(g, 'p1', 'characters', SN.rayleigh))).toBe(10000);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(at(g, 'p1', 'characters', SN.rayleigh))).toBe(8000);
  });
});

/**
 * EB02-007 Cloven Rose Blizzard (Red Event, cost 3, {Animal}/{Straw Hat Crew}/{Water Seven}).
 *
 * Card text: "[Main] Up to a total of 3 of your Leader and Character cards gain +1000 power during this
 * turn. Then, K.O. up to 1 of your opponent's Characters with 3000 power or less. [Trigger] K.O. up to
 * 1 of your opponent's Characters with 4000 power or less."
 *
 * Rules: "up to a total of 3" picks 0 to 3 cards across the Leader and the Characters (own side only);
 * the boost lasts this turn; the K.O. targets an opposing Character by its current power ("or less" is
 * inclusive); "up to 1" may be 0; the [Trigger] has its own, higher threshold and no boost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  canFinish,
  chars,
  choices,
  decision,
  hitLeader,
  kind,
  LE,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickSome,
  playRaw,
  SE,
  theirs,
  trash,
  toMyNextMain,
  hand,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const BLIZZARD = 'EB02-007';

function play(own: string[], opp: string[]) {
  const g = mine(LE.luffy, { hand: [BLIZZARD], characters: own }, { characters: opp });
  playRaw(g, BLIZZARD);
  return g;
}

describe('EB02-007 Cloven Rose Blizzard: [Main] up to a total of 3 Leader/Characters gain +1000, then K.O. a Character with 3000 power or less', () => {
  it("offers the own Leader and own Characters (never the opponent's) for the boost", () => {
    const g = play([SE.sai, SE.marco], [SE.komachiyo]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(3);
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([LE.luffy, SE.sai, SE.marco].sort());
  });

  it('boosts the chosen Leader and 2 Characters by +1000 each and leaves the others alone', () => {
    const g = play([SE.sai, SE.marco, SE.hajrudin], []);
    pickSome(g, [g.leader('p1'), ch(g, 'p1', SE.sai), ch(g, 'p1', SE.marco)]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(ch(g, 'p1', SE.sai))).toBe(5000);
    expect(g.power(ch(g, 'p1', SE.marco))).toBe(6000);
    expect(g.power(ch(g, 'p1', SE.hajrudin))).toBe(6000);
  });

  it('"up to a total of 3": a fourth card cannot be chosen', () => {
    const g = play([SE.sai, SE.marco, SE.hajrudin], []);
    expect(decision(g)?.max).toBe(3);
    for (let i = 0; i < 3; i++) {
      act(
        g,
        g.legal().find((x) => x.type === 'pick')!,
      );
    }
    // Three of the four candidates are picked; finish the choice if it is still open.
    if (kind(g) === 'choose' && g.legal().some((x) => x.type === 'done')) act(g, { type: 'done' });
    const base = new Map([
      [g.leader('p1'), 5000],
      [ch(g, 'p1', SE.sai), 4000],
      [ch(g, 'p1', SE.marco), 5000],
      [ch(g, 'p1', SE.hajrudin), 6000],
    ]);
    const boosted = [...base].filter(([i, b]) => g.power(i) === b + 1000);
    expect(boosted).toHaveLength(3);
  });

  it('"up to": 0 or 1 targets are allowed', () => {
    const g = play([SE.sai], []);
    expect(canFinish(g)).toBe(true);
    pickSome(g, [ch(g, 'p1', SE.sai)]);
    expect(g.power(ch(g, 'p1', SE.sai))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('K.O.s an opposing Character with exactly 3000 power and offers nothing above (boundary)', () => {
    const g = play([], [SE.komachiyo, SE.sai]);
    if (kind(g) === 'choose' && canFinish(g) && choices(g).includes(g.leader('p1'))) none(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.komachiyo]);
    pickCards(g, [SE.komachiyo]);
    expect(chars(g, 'p2')).toEqual([SE.sai]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([SE.komachiyo]);
  });

  it('K.O.s at most 1 Character even when two qualify', () => {
    const g = play([], [SE.komachiyo, SE.mohji]);
    none(g);
    pickCards(g, [SE.komachiyo]);
    expect(kind(g)).toBe('main');
    expect(chars(g, 'p2')).toEqual([SE.mohji]);
  });

  it('the K.O. "up to 1" may be skipped', () => {
    const g = play([], [SE.komachiyo]);
    none(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([SE.komachiyo]);
    expect(trash(g)).toEqual([BLIZZARD]);
  });

  it('the Event goes to the trash after it resolves', () => {
    const g = play([SE.sai], [SE.komachiyo]);
    pickSome(g, [ch(g, 'p1', SE.sai)]);
    pickCards(g, [SE.komachiyo]);
    expect(trash(g)).toEqual([BLIZZARD]);
    expect(hand(g)).toEqual([]);
  });

  it('the boost lasts this turn only', () => {
    const g = play([SE.sai], []);
    pickSome(g, [g.leader('p1'), ch(g, 'p1', SE.sai)]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(ch(g, 'p1', SE.sai))).toBe(4000);
  });
});

describe('EB02-007 Cloven Rose Blizzard: [Trigger] K.O. a Character with 4000 power or less', () => {
  function triggered(opp: string[]) {
    const g = theirs(
      LE.luffy,
      { life: [BLIZZARD, SE.mohji, SE.mohji, SE.mohji] },
      { characters: opp },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    return g;
  }

  it('offers opposing Characters with 4000 power or less (boundary 4000 yes, 5000 no) and K.O.s the chosen one', () => {
    const g = triggered([SE.sai, SE.komachiyo, SE.marco]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.sai, SE.komachiyo].sort());
    pickCards(g, [SE.sai]);
    expect(chars(g, 'p2')).toEqual([SE.komachiyo, SE.marco].sort());
  });

  it('has no +1000 boost step: the first prompt is the K.O. target', () => {
    const g = triggered([SE.sai]);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([SE.sai]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = triggered([SE.sai]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([SE.sai]);
  });
});

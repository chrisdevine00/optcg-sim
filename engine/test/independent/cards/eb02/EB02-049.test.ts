/**
 * EB02-049 Monkey.D.Garp (Black Character, cost 5, 6000, no Counter, {Navy}).
 *
 * Card text: "[On Play] Give up to 2 rested DON!! cards to 1 of your Leader. [Activate: Main] You may rest
 * this Character: If your Leader is [Monkey.D.Garp], K.O. up to 1 of your opponent's Characters with a
 * cost of 1 or less."
 *
 * Rules: "give up to 2 rested DON!!" asks a count (most first) and only rested cost-area DON!! can be
 * given; the DON!! paid for Garp are rested by then. The "If" after the colon is an effect condition:
 * the rest cost is paid even if the Leader is not [Monkey.D.Garp]. "Up to 1" may be 0.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canUseAbility,
  chars,
  donCountOptions,
  donOf,
  kind,
  LE,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SE,
  skipEmptyPick,
  takeDon,
  useAbility,
  kw,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const GARP = 'EB02-049';

/** p1 plays Garp with exactly 5 active DON!! (all 5 end up rested) unless `cost` says otherwise. */
function played(cost = { active: 5, rested: 0 }) {
  const g = mine(LE.luffy, { hand: [GARP], costArea: cost });
  playRaw(g, GARP);
  return g;
}

describe('EB02-049 Monkey.D.Garp: printed values', () => {
  it('cost 5, 6000 power, no Counter, no keyword', () => {
    const g = mine(LE.luffy, { characters: [GARP] });
    const c = ch(g, 'p1', GARP);
    expect(g.card(c).cost).toBe(5);
    expect(g.power(c)).toBe(6000);
    expect(g.card(c).counter).toBeNull();
    expect(kw(g, c)).toEqual([]);
  });
});

describe('EB02-049 Monkey.D.Garp: [On Play] give up to 2 rested DON!! to the Leader', () => {
  it('asks a count (most first): 2, 1 or none', () => {
    const g = played();
    expect(donCountOptions(g)).toEqual(['2', '1', '0']);
  });

  it('giving 2: the Leader gets 2 DON!! (+2000 power on our turn) taken from the rested ones', () => {
    const g = played();
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5, given: 0 });
    takeDon(g, 2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(kind(g)).toBe('main');
  });

  it('giving 1: only 1 DON!! is given', () => {
    const g = played();
    takeDon(g, 1);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 4, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to": giving none is allowed', () => {
    const g = played();
    takeDon(g, 0);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 5, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only rested DON!! are given: active DON!! stay active', () => {
    const g = played({ active: 8, rested: 0 });
    // 5 paid DON!! are rested, 3 are still active.
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 5 });
    takeDon(g, 2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 3, given: 2 });
  });

  it('already rested DON!! count as well as the paid ones', () => {
    const g = played({ active: 5, rested: 3 });
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 8 });
    takeDon(g, 2);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 6, given: 2 });
  });

  it('the DON!! go to the Leader, not to Garp or another Character', () => {
    const g = mine(LE.luffy, {
      hand: [GARP],
      characters: [SE.sai],
      costArea: { active: 5, rested: 0 },
    });
    playRaw(g, GARP);
    takeDon(g, 2);
    expect(g.power(ch(g, 'p1', GARP))).toBe(6000);
    expect(g.power(ch(g, 'p1', SE.sai))).toBe(4000);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});

describe('EB02-049 Monkey.D.Garp: [Activate: Main] rest this: K.O. a cost 1 or less Character if the Leader is [Monkey.D.Garp]', () => {
  function withLeader(
    leader: string,
    opp: string[],
    own: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[] = [],
  ) {
    return mine(leader, { characters: [GARP, ...own] }, { characters: opp });
  }

  it('Leader is [Monkey.D.Garp]: rests Garp and K.O.s the chosen cost 1 Character', () => {
    const g = withLeader(LE.garp, [SE.komachiyo, SE.sai]);
    useAbility(g, ch(g, 'p1', GARP));
    need(g, 'choose', 'p1');
    pickCards(g, [SE.komachiyo]);
    expect(g.card(ch(g, 'p1', GARP)).rested).toBe(true);
    expect(chars(g, 'p2')).toEqual([SE.sai]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([SE.komachiyo]);
  });

  it('offers only opposing Characters with cost 1 or less (boundary 1 yes, 2 no; own Characters never)', () => {
    const g = withLeader(LE.garp, [SE.komachiyo, SE.sai, SE.marco], [SE.mohji]);
    useAbility(g, ch(g, 'p1', GARP));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.komachiyo]);
    none(g);
  });

  it('"up to 1": may K.O. nothing; Garp is still rested (cost paid)', () => {
    const g = withLeader(LE.garp, [SE.komachiyo]);
    useAbility(g, ch(g, 'p1', GARP));
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([SE.komachiyo]);
    expect(g.card(ch(g, 'p1', GARP)).rested).toBe(true);
  });

  it('K.O.s at most 1 Character even when two qualify', () => {
    const g = withLeader(LE.garp, [SE.komachiyo, SE.mohji]);
    useAbility(g, ch(g, 'p1', GARP));
    pickCards(g, [SE.komachiyo]);
    expect(kind(g)).toBe('main');
    expect(chars(g, 'p2')).toEqual([SE.mohji]);
  });

  it("Leader is not [Monkey.D.Garp]: the rest cost is paid but nothing is K.O.'d", () => {
    const g = withLeader(LE.luffy, [SE.komachiyo]);
    useAbility(g, ch(g, 'p1', GARP));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(g.card(ch(g, 'p1', GARP)).rested).toBe(true);
    expect(chars(g, 'p2')).toEqual([SE.komachiyo]);
  });

  it('a rested Garp cannot activate (the rest cost cannot be paid)', () => {
    const g = mine(
      LE.garp,
      { characters: [{ card: GARP, rested: true }] },
      { characters: [SE.komachiyo] },
    );
    expect(canUseAbility(g, ch(g, 'p1', GARP))).toBe(false);
  });

  it('an active Garp offers the activation', () => {
    const g = withLeader(LE.garp, [SE.komachiyo]);
    expect(canUseAbility(g, ch(g, 'p1', GARP))).toBe(true);
  });

  it('can be used the turn Garp was played (resting needs no earlier turn)', () => {
    const g = withLeader(LE.garp, [SE.komachiyo], []);
    const played2 = mine(
      LE.garp,
      { characters: [{ card: GARP, playedThisTurn: true }] },
      { characters: [SE.komachiyo] },
    );
    expect(canUseAbility(g, ch(g, 'p1', GARP))).toBe(true);
    expect(canUseAbility(played2, ch(played2, 'p1', GARP))).toBe(true);
  });

  it("with no opposing Character of cost 1 or less nothing is K.O.'d", () => {
    const g = withLeader(LE.garp, [SE.sai]);
    useAbility(g, ch(g, 'p1', GARP));
    skipEmptyPick(g);
    expect(chars(g, 'p2')).toEqual([SE.sai]);
  });
});

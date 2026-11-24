/**
 * OP13-031 Trafalgar Law (Character, Green, cost 6, 6000, no Counter, {FILM}/{Heart Pirates}/
 * {Supernovas}, Slash).
 *
 * Card text: "If you have 1 or less Life cards, this Character gains [Blocker]. [On Play] You may
 * return 1 of your Characters to the owner's hand: Play up to 1 Character card with a cost of 5 or
 * less from your hand rested."
 *
 * Rules: [Blocker] (CR 10-1-4) from a permanent effect while the condition holds; a "you may" cost
 * is paid in full or not at all (CR 8-3); a returned Character is in my hand and can be the card
 * played; a card played "rested" arrives rested, without paying its cost; given DON!! return to the
 * cost area rested when their card leaves the field; an "up to" pick from the hand is asked even
 * when no card qualifies (a prompt never depends on hidden cards).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  charsOfIds,
  cardIds,
  decision,
  doneRaw,
  don,
  kind,
  kw,
  L13,
  mine,
  need,
  no,
  none,
  noDefence,
  offeredIds,
  offeredInsts,
  pickInst,
  playRaw,
  theirs,
  yes,
  V13,
  hand,
} from './kit-op13a.ts';

const LAW = 'OP13-031';
const METEOR = 'OP13-020';

const lifeOf = (n: number) => Array.from({ length: n }, () => V13.mohji);

describe('OP13-031 Trafalgar Law: [Blocker] with 1 or less Life cards', () => {
  const law = (g: ReturnType<typeof mine>) => at(g, 'p1', 'characters', LAW);

  it('printed values: cost 6, 6000, no Counter', () => {
    const g = mine(L13.luffy, { hand: [LAW] });
    const c = g.card(at(g, 'p1', 'hand', LAW));
    expect(c.cost).toBe(6);
    expect(c.counter ?? null).toBeNull();
    playRaw(g, LAW);
    expect(g.power(at(g, 'p1', 'characters', LAW))).toBe(6000);
  });

  it('boundary: 2 Life cards: no [Blocker]; 1 Life card: [Blocker]; 0 Life cards: [Blocker]', () => {
    const two = mine(L13.luffy, { characters: [LAW], life: lifeOf(2) });
    const one = mine(L13.luffy, { characters: [LAW], life: lifeOf(1) });
    const zero = mine(L13.luffy, { characters: [LAW], life: [] });
    expect(kw(two, law(two))).not.toContain('Blocker');
    expect(kw(one, law(one))).toContain('Blocker');
    expect(kw(zero, law(zero))).toContain('Blocker');
  });

  it('with 4 or 5 Life it has no [Blocker]', () => {
    const g = mine(L13.luffy, { characters: [LAW] });
    expect(g.life('p1')).toBe(4);
    expect(kw(g, law(g))).not.toContain('Blocker');
  });

  it('with 1 Life it can block an attack on my Leader', () => {
    const g = theirs(
      L13.luffy,
      { characters: [LAW], life: lifeOf(1) },
      { characters: [V13.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', V13.thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([law(g)]);
  });

  it('with 2 Life it cannot block', () => {
    const g = theirs(
      L13.luffy,
      { characters: [LAW], life: lifeOf(2) },
      { characters: [V13.thatch] },
    );
    attack(g, at(g, 'p2', 'characters', V13.thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('the condition is live: after a hit takes my Life from 2 to 1, Law can block the next attack', () => {
    const g = theirs(
      L13.luffy,
      { characters: [LAW], life: lifeOf(2) },
      { characters: [V13.thatch, V13.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', V13.thatch), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(1);
    need(g, 'main', 'p2');
    attack(g, at(g, 'p2', 'characters', V13.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([law(g)]);
  });
});

describe('OP13-031 Trafalgar Law: [On Play] return 1 of my Characters: play up to 1 Character with cost 5 or less rested', () => {
  function board(handCards: string[], chars: string[] = [V13.koala]) {
    const g = mine(L13.luffy, {
      hand: [LAW, ...handCards],
      characters: chars,
      costArea: { active: 10, rested: 0 },
    });
    playRaw(g, LAW);
    return g;
  }
  const pay = (g: ReturnType<typeof board>, card: string) => {
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', card)]);
  };

  it('the cost is optional: offered with a legal "use"; declining returns and plays nothing', () => {
    const g = board([V13.marco]);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    no(g, 'p1');
    expect(charsOfIds(g, 'p1')).toEqual([LAW, V13.koala].sort());
    expect(hand(g)).toEqual([V13.marco]);
  });

  it('the cost offers my Characters, Law herself included', () => {
    const g = board([V13.marco]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredInsts(g).sort()).toEqual(
      [at(g, 'p1', 'characters', LAW), at(g, 'p1', 'characters', V13.koala)].sort(),
    );
  });

  it('paying: the Character returns to hand, then a Character with cost 5 or less is played rested (cost 6 and Events are not offered)', () => {
    const g = board([V13.marco, V13.thatch, V13.kingdew, METEOR]);
    pay(g, V13.koala);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.koala, V13.kingdew, V13.marco].sort());
    pickInst(g, [at(g, 'p1', 'hand', V13.kingdew)]);
    expect(g.card(at(g, 'p1', 'characters', V13.kingdew)).rested).toBe(true);
    expect(charsOfIds(g, 'p1')).toEqual([LAW, V13.kingdew].sort());
    expect(hand(g)).toEqual([V13.koala, V13.marco, V13.thatch, METEOR].sort());
  });

  it('the returned Character itself may be the card played (it is in hand now), rested', () => {
    const g = board([]);
    pay(g, V13.koala);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.koala]);
    pickInst(g, [at(g, 'p1', 'hand', V13.koala)]);
    expect(charsOfIds(g, 'p1')).toEqual([LAW, V13.koala].sort());
    expect(g.card(at(g, 'p1', 'characters', V13.koala)).rested).toBe(true);
  });

  it('the play costs no DON!!: the active count is unchanged by it', () => {
    const g = board([V13.kingdew]);
    const before = don(g);
    pay(g, V13.koala);
    pickInst(g, [at(g, 'p1', 'hand', V13.kingdew)]);
    expect(don(g)).toEqual(before);
  });

  it('"up to 1": the play may be skipped; the cost stays paid (the Character stays in hand)', () => {
    const g = board([V13.marco]);
    pay(g, V13.koala);
    need(g, 'choose', 'p1');
    none(g);
    expect(charsOfIds(g, 'p1')).toEqual([LAW]);
    expect(hand(g)).toEqual([V13.koala, V13.marco].sort());
  });

  it('plays at most one Character', () => {
    const g = board([V13.marco, V13.kingdew]);
    pay(g, V13.koala);
    pickInst(g, [at(g, 'p1', 'hand', V13.marco)]);
    expect(kind(g)).toBe('main');
    expect(charsOfIds(g, 'p1')).toEqual([LAW, V13.marco].sort());
  });

  it('Law may return herself: she goes to hand (cost 6 is too high to replay) and another Character is played', () => {
    const g = board([V13.marco], []);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    // With Law the only Character the cost pick has one candidate: the engine may decide it itself.
    if (decision(g)?.purpose === 'cost') pickInst(g, [at(g, 'p1', 'characters', LAW)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.marco]);
    pickInst(g, [at(g, 'p1', 'hand', V13.marco)]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([LAW]);
    expect(charsOfIds(g, 'p1')).toEqual([V13.marco]);
  });

  it('a DON!! given to the returned Character goes back to the cost area (rested)', () => {
    const g = mine(L13.luffy, {
      hand: [LAW],
      characters: [{ card: V13.koala, don: 1 }] as never,
      costArea: { active: 9, rested: 0 },
    });
    playRaw(g, LAW);
    expect(don(g).given).toBe(1);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', V13.koala)]);
    expect(don(g).given).toBe(0);
    expect(don(g).rested).toBe(1 + 6); // 6 paid for Law and the returned DON!!
  });

  it('with no Character card of cost 5 or less in hand the pick is still asked (never depends on hidden cards)', () => {
    const g = board([V13.thatch, METEOR], []);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (decision(g)?.purpose === 'cost') pickInst(g, [at(g, 'p1', 'characters', LAW)]);
    // Law (cost 6), Thatch (cost 6) and an Event: nothing qualifies, yet the up-to pick is asked.
    expect(decision(g)?.kind).toBe('choose');
    expect(offeredInsts(g)).toEqual([]);
    doneRaw(g);
    expect(atMain(g, 'p1')).toBe(true);
    expect(charsOfIds(g, 'p1')).toEqual([]);
  });
});

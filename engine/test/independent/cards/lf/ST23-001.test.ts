/**
 * ST23-001 Uta (Character, Red, cost 6, 4000, Counter +2000, {FILM}, [Blocker]).
 *
 * Card text: "If you have a Character with 10000 power or more, give this card in your hand -4 cost.
 * [Blocker]"
 *
 * Rules: CR 2-7-6 (cost is the current cost), CR 3-1-6 (a card that moves to the field is a new
 * card; hand modifiers do not carry over), CR 10-1-4 ([Blocker]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  blockers,
  block,
  donOf,
  kind,
  LB,
  mine,
  need,
  passCounter,
  playRaw,
  SL,
  theirs,
} from './kit-lfb.ts';

const ID = 'ST23-001';
const BIG10 = SL.big8; // OP12-005 Shiki: 10000
const BIG9 = SL.allies7; // OP02-020 LittleOars Jr.: 9000

function hold(o: {
  rested?: number;
  chars?: (string | { card: string; rested?: boolean; don?: number })[];
  active: number;
  p2chars?: string[];
}) {
  return mine(
    LB.luffy,
    {
      hand: [ID],
      characters: o.chars ?? [],
      costArea: { active: o.active, rested: o.rested ?? 10 - o.active },
    },
    { characters: o.p2chars ?? [] },
  );
}

const canPlay = (g: ReturnType<typeof hold>) => {
  const card = g.find('p1', 'hand', ID);
  expect(g.decider).toBe('p1');
  return g.legal().some((a) => a.type === 'playCard' && a.card === card);
};

describe('ST23-001 Uta: with a Character of 10000 power or more, this card in hand costs 4 less', () => {
  it('with a 10000-power Character the card costs 2: it can be played with 2 active DON!!, paying 2', () => {
    const g = hold({ chars: [BIG10], active: 2 });
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(2);
    expect(canPlay(g)).toBe(true);
    playRaw(g, ID);
    expect(donOf(g, 'p1').active).toBe(0);
    expect(at(g, 'p1', 'characters', ID)).toBeTruthy();
  });

  it('with 1 active DON!! the reduced cost of 2 still cannot be paid', () => {
    const g = hold({ chars: [BIG10], active: 1 });
    expect(canPlay(g)).toBe(false);
  });

  it('without such a Character the card costs its printed 6', () => {
    const g = hold({ chars: [SL.c4], active: 5 });
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(6);
    expect(canPlay(g)).toBe(false);
    const g2 = hold({ chars: [SL.c4], active: 6 });
    expect(canPlay(g2)).toBe(true);
  });

  it('boundary: a 9000-power Character does not reduce the cost, 10000 does', () => {
    const g = hold({ chars: [BIG9], active: 2 });
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(6);
    expect(canPlay(g)).toBe(false);
  });

  it('power is current power: a 9000 Character with 1 DON!! given (10000) reduces the cost', () => {
    const g = hold({ chars: [{ card: BIG9, don: 1 }], active: 2, rested: 7 });
    expect(g.power(at(g, 'p1', 'characters', BIG9))).toBe(10000);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(2);
    expect(canPlay(g)).toBe(true);
  });

  it('a rested 10000-power Character still counts', () => {
    const g = hold({ chars: [{ card: BIG10, rested: true }], active: 2 });
    expect(canPlay(g)).toBe(true);
  });

  it('only my own Characters count: an opposing 10000-power Character does not reduce the cost', () => {
    const g = hold({ chars: [], active: 2, p2chars: [BIG10] });
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(6);
    expect(canPlay(g)).toBe(false);
  });

  it('the reduction is for the card in hand: once played, Uta has its printed cost 6', () => {
    const g = hold({ chars: [BIG10], active: 2 });
    playRaw(g, ID);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(6);
  });

  it('two copies in hand are both reduced', () => {
    const g = mine(LB.luffy, {
      hand: [ID, ID],
      characters: [BIG10],
      costArea: { active: 4, rested: 6 },
    });
    const copies = g.zone('p1', 'hand').map((c) => c.instance);
    expect(g.card(copies[0]!).cost).toBe(2);
    expect(g.card(copies[1]!).cost).toBe(2);
    expect(atMain(g)).toBe(true);
  });
});

describe('ST23-001 Uta: [Blocker]', () => {
  it('has [Blocker], and can block an attack on my Leader (rested after blocking)', () => {
    const g = theirs(LB.luffy, { characters: [ID] }, { life: [] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    block(g, at(g, 'p1', 'characters', ID));
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    passCounter(g);
    // 4000 Uta loses to the 5000 attacker and is K.O.'d; the Leader keeps all its Life.
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
    expect(act).toBeTypeOf('function');
  });

  it('a rested Uta cannot block', () => {
    const g = theirs(LB.luffy, { characters: [{ card: ID, rested: true }] });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });
});

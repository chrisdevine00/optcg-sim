/**
 * OP12-030 Dracule Mihawk (Character, Green, cost 8, 8000, no Counter, {The Seven Warlords of the
 * Sea} {Muggy Kingdom}).
 *
 * Card text: "[Blocker] [On Play] Set up to 4 of your DON!! cards as active. Then, you cannot play
 * Character cards with a base cost of 7 or more during this turn."
 *
 * Rules: "set up to N DON!! as active" asks a count, most first (engine convention, DECISIONS
 * 2026-11-24); only rested cost-area DON!! can be set; "base cost" ignores modifiers (a card whose
 * cost is lowered by an effect in hand keeps its base cost); the bar covers Character cards only
 * and ends with the turn. OP17-005 (printed cost 10, "give this card in your hand -4 cost" when the
 * opponent has a 10000-power Character) probes the base-versus-current cost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  blockers,
  canPlayCard,
  chr,
  decision,
  donOf,
  kind,
  kw,
  LD12,
  mine,
  need,
  optionChoices,
  playRaw,
  S12,
  side,
  theirTurn,
  toMyNextMain,
} from './kit-op12a.ts';

const MIH = 'OP12-030';
const BIG = 'OP17-005';

/** p1 Main Phase with Mihawk (cost 8) in hand and `extra` cards; 10 active DON!!. */
function board(extra: string[] = [], p2: string[] = []) {
  return mine(
    LD12.luffy,
    { hand: [MIH, ...extra], costArea: { active: 10, rested: 0 } },
    { characters: p2 },
  );
}

/** Answer the count question of "set up to N DON!! as active" with n. */
function setCount(g: ReturnType<typeof board>, n: number) {
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('mode');
  expect(optionChoices(g)).toContain(String(n));
  act(g, { type: 'pick', choice: { option: String(n) } });
}

describe('OP12-030 Dracule Mihawk: [Blocker]; [On Play] set up to 4 DON!! active, then no Characters of base cost 7 or more', () => {
  it('printed values: cost 8, 8000, no Counter, [Blocker]', () => {
    const g = board();
    const c = g.card(g.find('p1', 'hand', MIH));
    expect([c.cost, c.power, c.counter]).toEqual([8, 8000, null]);
    playRaw(g, MIH);
    expect(kw(g, chr(g, 'p1', MIH))).toContain('Blocker');
  });

  it('playing it rests 8 DON!!, then the effect asks how many (up to 4) to set active: 4 makes 6 active', () => {
    const g = board();
    playRaw(g, MIH);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
    setCount(g, 4);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
  });

  it('"up to 4": fewer can be chosen (2 makes 4 active) and 0 is allowed', () => {
    const two = board();
    playRaw(two, MIH);
    setCount(two, 2);
    expect(donOf(two, 'p1')).toMatchObject({ active: 4, rested: 6 });
    const zero = board();
    playRaw(zero, MIH);
    setCount(zero, 0);
    expect(donOf(zero, 'p1')).toMatchObject({ active: 2, rested: 8 });
  });

  it('no more than 4 can be chosen', () => {
    const g = board();
    playRaw(g, MIH);
    expect(optionChoices(g)).not.toContain('5');
  });

  it('the bar looks at the base cost: OP17-005 (printed 10, cost 6 in hand) is playable without the bar and not with it', () => {
    // control: 6 active DON!!, a 10000-power opponent Character: the cost-10 card costs 6
    const control = mine(
      LD12.luffy,
      { hand: [BIG], costArea: { active: 6, rested: 4 } },
      { characters: [S12.shiki] },
    );
    expect(control.card(control.find('p1', 'hand', BIG)).cost).toBe(6);
    expect(canPlayCard(control, control.find('p1', 'hand', BIG))).toBe(true);

    const g = board([BIG], [S12.shiki]);
    playRaw(g, MIH);
    setCount(g, 4);
    expect(donOf(g, 'p1').active).toBe(6);
    expect(g.card(g.find('p1', 'hand', BIG)).cost).toBe(6);
    expect(canPlayCard(g, g.find('p1', 'hand', BIG))).toBe(false);
  });

  it('the bar applies even when 0 DON!! were set active (it is a separate step)', () => {
    const g = board([BIG, S12.sai], [S12.shiki]);
    playRaw(g, MIH);
    setCount(g, 0);
    expect(canPlayCard(g, g.find('p1', 'hand', BIG))).toBe(false);
    expect(canPlayCard(g, g.find('p1', 'hand', S12.sai))).toBe(true);
  });

  it('Characters of base cost 6 or less are still playable (cost 6 boundary)', () => {
    const g = board([S12.thatch, S12.hajrudin]);
    playRaw(g, MIH);
    setCount(g, 4);
    expect(canPlayCard(g, g.find('p1', 'hand', S12.thatch))).toBe(true);
    expect(canPlayCard(g, g.find('p1', 'hand', S12.hajrudin))).toBe(true);
  });

  it('the bar ends with the turn: next turn OP17-005 can be played again', () => {
    const g = board([BIG], [S12.shiki]);
    playRaw(g, MIH);
    setCount(g, 4);
    toMyNextMain(g);
    expect(decision(g)?.kind).toBe('main');
    expect(canPlayCard(g, g.find('p1', 'hand', BIG))).toBe(true);
  });

  it('must not: the bar is not there before Mihawk is played, and DON!! already active are untouched', () => {
    const g = board([BIG], [S12.shiki]);
    expect(canPlayCard(g, g.find('p1', 'hand', BIG))).toBe(true);
    playRaw(g, MIH);
    setCount(g, 4);
    expect(donOf(g, 'p1').active + donOf(g, 'p1').rested).toBe(10);
    expect(kind(g)).toBe('main');
  });

  it('[Blocker]: Mihawk can be chosen as the blocker on the opponent turn', () => {
    const g = theirTurn(
      side(LD12.luffy, S12.mohji, { characters: [MIH] }),
      side(LD12.luffy, S12.sunny, { costArea: { active: 10, rested: 0 } }),
    );
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    expect(blockers(g)).toEqual([chr(g, 'p1', MIH)]);
  });
});

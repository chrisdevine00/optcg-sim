/**
 * OP17-049 Charlotte Linlin (Character, Blue, cost 5, 7000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[On Play] Your opponent chooses one:
 *    • Draw 2 cards.
 *    • Your opponent trashes 2 cards from their hand.
 *    [On Your Opponent's Attack] [Once Per Turn] You may trash 1 card from your hand: Up to 1 of
 *    your Leader or Characters gains +1000 power during this battle."
 *
 * Reading: "you"/"your" is Linlin's controller (p1) throughout. The first mode has no subject, so
 * p1 draws (CR 8-4-4-3). In the second, "your opponent" (p2) trashes 2 from p2's hand. p2 picks the
 * mode (effect-dsl §4.11 `chooseOne`, chooser = opponent). The API gives modes no names, so the
 * tests assert the two reachable outcomes (API-GAPS.md).
 *
 * Rules: [On Your Opponent's Attack] activates before Block and Counter (RL-18); [Once Per Turn]
 * is used only when the effect resolves (CR 10-2-13-1/-3, as RL-45). "During this battle" ends at
 * End of the Battle (RL-08).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, decision, fill, noDefence, play } from '../helpers.ts';
import {
  accept,
  BLUE,
  choose,
  count,
  decline,
  LEAD,
  myTurn,
  offered,
  outcomes,
  payWith,
  RED,
  ROCKS,
  side,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function onPlay(p2Hand: string[]) {
  const g = myTurn(
    side(LEAD.rocks, BLUE, {
      hand: [ROCKS.linlin],
      deck: [VAN.marco, VAN.sai, ...fill(BLUE, 10)],
      costArea: { active: 5, rested: 0 },
    }),
    side(LEAD.luffy, RED, { hand: p2Hand }),
  );
  play(g, g.find('p1', 'hand', ROCKS.linlin));
  return g;
}

/** p1 hand size / p1 deck size / p2 hand size / p2 trash size. */
const counts = (g: TestGame) =>
  [
    count(g, 'p1', 'hand'),
    count(g, 'p1', 'deck'),
    count(g, 'p2', 'hand'),
    count(g, 'p2', 'trash'),
  ].join('/');

function defending(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(LEAD.crocodile, BLUE, { characters: [ROCKS.linlin], hand: [VAN.mohji], ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.marco], ...p2 }),
  );
}

describe('OP17-049 Charlotte Linlin: [On Play] your opponent chooses one', () => {
  it('the opponent (p2) owes the choice, not p1', () => {
    const g = onPlay([VAN.komachiyo, VAN.sai, VAN.marco]);
    expect(decision(g)?.player).toBe('p2');
  });

  it('exactly two outcomes: p1 draws 2, or p2 trashes 2 of 3 hand cards', () => {
    const g = onPlay([VAN.komachiyo, VAN.sai, VAN.marco]);
    // Before: p1 hand 0, deck 12; p2 hand 3, trash 0.
    expect(outcomes(g, 'p2', counts)).toEqual(new Set(['2/10/3/0', '0/12/1/2']));
  });

  it('the trash mode lets p2 choose which 2 of its cards to trash', () => {
    const g = onPlay([VAN.komachiyo, VAN.sai, VAN.marco]);
    const kept = outcomes(g, 'p2', (b) =>
      b
        .zone('p2', 'hand')
        .map((c) => c.card)
        .sort()
        .join(','),
    );
    // Draw mode keeps all 3; trash mode can keep any single card.
    expect(kept).toEqual(
      new Set([
        [VAN.komachiyo, VAN.sai, VAN.marco].sort().join(','),
        VAN.komachiyo,
        VAN.sai,
        VAN.marco,
      ]),
    );
  });

  it('CR 1-3-2: with 1 card in p2’s hand, the trash mode trashes that 1 card', () => {
    const g = onPlay([VAN.komachiyo]);
    expect(outcomes(g, 'p2', counts)).toEqual(new Set(['2/10/1/0', '0/12/0/1']));
  });
});

describe('OP17-049 Charlotte Linlin: [On Your Opponent’s Attack] trash 1 → +1000 during this battle', () => {
  it('happy path: +1000 on the attacked Leader stops a 5000 attack; it ends with the battle', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    choose(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('RL-18: it is decided before the Block Step', () => {
    const g = defending({ characters: [ROCKS.linlin, ROCKS.gloriosa] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(decision(g)).toMatchObject({ kind: 'optional', player: 'p1' });
    decline(g);
    expect(decision(g)).toMatchObject({ kind: 'block', player: 'p1' });
  });

  it('"up to 1 of your Leader or Characters": a Character not being attacked may get the +1000', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    const linlin = g.find('p1', 'characters', ROCKS.linlin);
    choose(g, [linlin]);
    expect(g.power(linlin)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second attack in the same turn offers nothing', () => {
    const g = defending({ hand: [VAN.mohji, VAN.gordon] });
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    choose(g, [g.leader('p1')]);
    noDefence(g);
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('CR 10-2-13-1 (as RL-45): declining keeps it for the next attack', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    decline(g);
    noDefence(g);
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('CR 8-3-1-3: with an empty hand nothing is offered', () => {
    const g = defending({ hand: [] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('timing: it does not activate when p1 attacks on p1’s own turn', () => {
    const g = myTurn(
      side(LEAD.crocodile, BLUE, { characters: [ROCKS.linlin], hand: [VAN.mohji] }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(false);
  });
});

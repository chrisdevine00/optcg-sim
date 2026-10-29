/**
 * OP17-042 Kaido (Character, Blue, cost 4, 6000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data; the "−" in "−3000" is a recorded sign repair, textFixes):
 *   "[Blocker]
 *
 *    [On Play] You may reveal 3 cards with a type including "Rocks Pirates" from your hand: Give up
 *    to 1 of your opponent's Characters −3000 power during this turn."
 *
 * Rules: revealing is a cost; the revealed cards stay in hand (CR 11-2-2). A cost that cannot be
 * paid in full is not offered (CR 8-3-1-3). "Type including" is a substring match (CR 2-4-3-1).
 * "During this turn" ends at End Phase step 6-6-1-3 (RL-09).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, blockers, endTurn, fill, noDefence, play } from '../helpers.ts';
import {
  accept,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  decline,
  LEAD,
  myTurn,
  offered,
  payWith,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';

const THREE_ROCKS = [ROCKS.kyo, ROCKS.streusen, ROCKS.shiki];

function game(hand: string[], p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LEAD.rocks, BLUE, {
      hand: [ROCKS.kaido, ...hand],
      costArea: { active: 4, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.marco], ...p2 }),
  );
}

function playKaido(g: ReturnType<typeof game>) {
  play(g, g.find('p1', 'hand', ROCKS.kaido));
}

function revealAll(g: ReturnType<typeof game>, cards: string[]) {
  payWith(
    g,
    cards.map((c) => g.find('p1', 'hand', c)),
  );
}

describe('OP17-042 Kaido: [Blocker]', () => {
  it('CR 10-1-4-1: it has [Blocker] and can block an attack on the Leader', () => {
    const g = theirTurn(
      side(LEAD.rocks, BLUE, { characters: [ROCKS.kaido] }),
      side(LEAD.luffy, RED),
    );
    const kaido = g.find('p1', 'characters', ROCKS.kaido);
    expect(g.card(kaido).keywords).toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([kaido]);
  });
});

describe('OP17-042 Kaido: [On Play] reveal 3 Rocks Pirates → −3000', () => {
  it('happy path: reveal 3, give an opponent’s Character −3000; the revealed cards stay in hand', () => {
    const g = game(THREE_ROCKS);
    playKaido(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    revealAll(g, THREE_ROCKS);
    const marco = g.find('p2', 'characters', VAN.marco);
    choose(g, [marco]);
    expect(g.power(marco)).toBe(2000);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([...THREE_ROCKS].sort());
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('target restriction: only the opponent’s Characters, not Leaders and not p1’s own Characters', () => {
    const g = game(THREE_ROCKS, { characters: [VAN.mohji] });
    playKaido(g);
    accept(g);
    revealAll(g, THREE_ROCKS);
    expect(choiceCards(g)).toEqual([VAN.marco]);
  });

  it('CR 8-4-4-1: "up to 1" allows choosing none; the reveal still happened and nothing changes', () => {
    const g = game(THREE_ROCKS);
    playKaido(g);
    accept(g);
    revealAll(g, THREE_ROCKS);
    chooseNone(g);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(5000);
    expect(g.zone('p1', 'hand')).toHaveLength(3);
  });

  it('"during this turn": the −3000 lasts after other actions this turn and is gone on the opponent’s turn', () => {
    const g = game(THREE_ROCKS);
    playKaido(g);
    accept(g);
    revealAll(g, THREE_ROCKS);
    const marco = g.find('p2', 'characters', VAN.marco);
    choose(g, [marco]);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(g.power(marco)).toBe(2000);
    endTurn(g);
    expect(g.power(marco)).toBe(5000);
  });

  it('CR 8-3-1-3: only 2 Rocks Pirates cards in hand → the cost cannot be paid, nothing is offered', () => {
    const g = game([ROCKS.kyo, ROCKS.streusen, VAN.mohji]);
    playKaido(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(5000);
  });

  it('the card being played does not count toward the 3 (it has left the hand)', () => {
    const g = game([ROCKS.kyo, ROCKS.streusen]);
    playKaido(g);
    expect(offered(g, 'p1')).toBe(false);
  });

  it('CR 2-4-3-1: "type including" counts OP08-051 Buckin (Former Rocks Pirates)', () => {
    const g = game([ROCKS.kyo, ROCKS.streusen, ROCKS.buckin]);
    playKaido(g);
    expect(offered(g, 'p1')).toBe(true);
  });

  it('declining reveals nothing and changes nothing', () => {
    const g = game(THREE_ROCKS);
    playKaido(g);
    decline(g);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(5000);
  });

  it('interaction: after −3000, a weaker attacker wins the battle and K.O.s the target', () => {
    // p2's Marco is rested (5000 → 2000); p1's OP02-060 Mohji (3000) attacks it.
    const g = game(
      THREE_ROCKS,
      { characters: [VAN.mohji] },
      {
        characters: [{ card: VAN.marco, rested: true }],
      },
    );
    playKaido(g);
    accept(g);
    revealAll(g, THREE_ROCKS);
    const marco = g.find('p2', 'characters', VAN.marco);
    choose(g, [marco]);
    attack(g, g.find('p1', 'characters', VAN.mohji), marco);
    noDefence(g);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.marco]);
  });

  it('fill check: the default deck is untouched by the reveal (reveal is not a draw)', () => {
    const g = game(THREE_ROCKS, { deck: fill(BLUE, 12) });
    playKaido(g);
    accept(g);
    revealAll(g, THREE_ROCKS);
    chooseNone(g);
    expect(g.zone('p1', 'deck')).toHaveLength(12);
  });
});

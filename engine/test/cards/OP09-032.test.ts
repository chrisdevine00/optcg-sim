/** OP09-032 Donquixote Rosinante. */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';
import { mk, p2Attacks } from './helpers-a09g2.ts';

const ID = 'OP09-032';
const LEADER = 'ST01-001';
const rosi = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);
const canBlock = (g: ReturnType<typeof mk>) =>
  g.isLegal({ type: 'block', blocker: rosi(g), player: 'p1' });

describe('OP09-032 Donquixote Rosinante', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(rosi(g)).keywords).toContain('Blocker');
  });

  it("[On Your Opponent's Attack]: a rested Rosinante is set active and can block", () => {
    const g = p2Attacks({ leader: LEADER, characters: [{ card: ID, rested: true }] });
    expect(g.card(rosi(g)).rested).toBe(false);
    expectDecision(g, 'block', 'p1');
    expect(canBlock(g)).toBe(true);
    g.act({ type: 'block', blocker: rosi(g) });
    expect(g.card(rosi(g)).rested).toBe(true);
  });

  it('[Once Per Turn]: blocking rests him again and a second attack does not set him active', () => {
    const g = p2Attacks({ leader: LEADER, characters: [{ card: ID, rested: true }] }, V.c1, [
      V.c1,
      V.c1,
    ]);
    g.act({ type: 'block', blocker: rosi(g) });
    endCounter(g);
    expectDecision(g, 'main', 'p2');
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c1, 1),
      target: g.leader('p1'),
    });
    expect(g.card(rosi(g)).rested).toBe(true);
    expect(canBlock(g)).toBe(false);
  });

  it('an active Rosinante stays active and the attack goes on to the block step', () => {
    const g = p2Attacks({ leader: LEADER, characters: [ID] });
    expect(g.card(rosi(g)).rested).toBe(false);
    expect(dec(g)?.kind).toBe('block');
  });

  it('fires for an attack on one of your Characters too', () => {
    const g = game(
      {
        leader: LEADER,
        characters: [
          { card: ID, rested: true },
          { card: V.c1, rested: true },
        ],
      },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c4),
      target: g.find('p1', 'characters', V.c1),
    });
    expect(g.card(rosi(g)).rested).toBe(false);
    expectDecision(g, 'block', 'p1');
    passBlock(g);
  });

  it('does not fire when you attack (not an opponent attack)', () => {
    const g = mk({ characters: [{ card: ID, rested: true }, V.c3] }, { characters: [V.c1] });
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', V.c3),
      target: g.leader('p2'),
    });
    expect(g.card(rosi(g)).rested).toBe(true);
  });
});

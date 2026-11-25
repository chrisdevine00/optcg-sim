/** ST36-005 Eustass"Captain"Kid. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  pick,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { canAccept } from './helpers-stg2.ts';

const ID = 'ST36-005';
const UP = { card: V.c6, faceUp: true };
const DOWN = V.c6;

/** p2's V.c4 (6000, active) attacks p1's Leader; p1 has the Kid and the given Life. */
const defend = (life: (string | { card: string; faceUp: boolean })[], chars: string[] = [ID]) => {
  const g = game(
    { leader: PLAIN_BLUE, characters: chars, life },
    { leader: PLAIN_PURPLE, characters: [V.c4] },
    { activePlayer: 'p2', turn: 4 },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c4),
    target: g.leader('p1'),
  });
  return g;
};
const faces = (g: ReturnType<typeof defend>) => g.zone('p1', 'life').map((c) => c.faceUp);

/** p1's Main Phase with a rested DON!! and the given Life. */
const main = (life: (string | { card: string; faceUp: boolean })[]) =>
  game(
    {
      leader: PLAIN_BLUE,
      characters: [ID],
      life,
      costArea: { active: 1, rested: 1 },
    },
    { leader: PLAIN_PURPLE },
  );
const activate = (g: ReturnType<typeof main>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'activate-main' });
const offered = (g: ReturnType<typeof main>) =>
  g
    .legal()
    .some((a) => a.type === 'activate' && a.ability === 'activate-main' && a.card !== undefined);

describe('ST36-005 Eustass"Captain"Kid', () => {
  it('[On Your Opponent’s Attack]: turns the bottom face-up Life card face-down and redirects to itself', () => {
    const g = defend([DOWN, DOWN, UP]);
    expectDecision(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(true);
    accept(g);
    // Only the bottom card is face-up: no end is asked, and the Kid is the only target.
    expect(dec(g)?.kind).not.toBe('choose');
    expect(faces(g)).toEqual([false, false, false]);
    expect(g.zone('p1', 'life')[2]!.card).not.toBe(V.c6 + 'x');
    expect(g.eventsOfType('LifeTurnedFaceDown')).toHaveLength(1);
    expect(g.eventsOfType('AttackRedirected')).toHaveLength(1);
    passBlock(g);
    endCounter(g);
    // 6000 against the Kid's 7000: the Kid survives, the Leader is untouched, no Life was taken.
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
  });

  it('W57-R9 boundary: another Kid with exactly 5000 base power is a redirect target, one with 4000 is not (kills basePower gte 5000 to 6000)', () => {
    const KID5000 = 'OP09-075';
    const KID4000 = 'P-003';
    const g = defend([DOWN, DOWN, UP], [ID, KID5000, KID4000]);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    const offered = g
      .legal()
      .filter((x) => x.type === 'pick' && typeof x.choice === 'string')
      .map((x) => (x as { choice: string }).choice)
      .sort();
    expect(offered).toEqual(
      [g.find('p1', 'characters', ID), g.find('p1', 'characters', KID5000)].sort(),
    );
  });

  it('with both ends face-up the controller chooses the end; the other stays face-up', () => {
    const g = defend([UP, DOWN, UP]);
    accept(g);
    const d = expectDecision(g, 'choose');
    expect(JSON.stringify(d)).toContain('top');
    expect(JSON.stringify(d)).toContain('bottom');
    g.act({ type: 'pick', choice: { option: 'top' } });
    expect(faces(g)).toEqual([false, false, true]);
    expect(g.eventsOfType('AttackRedirected')).toHaveLength(1);
  });

  it('a middle face-up Life card is not payable, nor are two face-down ends; the attack goes on', () => {
    const g = defend([DOWN, UP, DOWN]);
    // Not payable: the cost is not even offered, the Block Step follows.
    expectDecision(g, 'block', 'p1');
    expect(faces(g)).toEqual([false, true, false]);
    expect(g.eventsOfType('AttackRedirected')).toHaveLength(0);
    passBlock(g);
    endCounter(g);
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(2);
  });

  it('[Activate: Main]: turns the top or bottom face-down card face-up, then gives a rested DON!! to the Leader', () => {
    const g = main([UP, DOWN, DOWN]);
    expect(offered(g)).toBe(true);
    activate(g);
    // Only the bottom end is face-down (the top is face-up): no choice of end is asked; the next
    // decision is the DON!! target.
    expect(dec(g)).toMatchObject({ kind: 'choose', purpose: 'target' });
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).toBe('main');
    expect(faces(g)).toEqual([true, false, true]);
    expect(g.zone('p1', 'life')[2]!.card).toBe(V.c6);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('[Activate: Main] with both ends face-down asks for the end, is once per turn, and needs a face-down end', () => {
    const g = main([DOWN, UP, DOWN]);
    activate(g);
    const d = expectDecision(g, 'choose');
    expect(JSON.stringify(d)).toContain('bottom');
    g.act({ type: 'pick', choice: { option: 'bottom' } });
    pick(g, [g.leader('p1')]);
    expect(faces(g)).toEqual([false, true, true]);
    // Once per turn.
    expect(offered(g)).toBe(false);
    // Both ends face-up (and not usable) another turn: not offered.
    expect(offered(main([UP, DOWN, UP]))).toBe(false);
    expect(offered(main([]))).toBe(false);
  });
});

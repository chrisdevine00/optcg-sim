/** OP18-072 The Franky Family. OP-18 wave G2. */
import { describe, expect, it } from 'vitest';
import { game, pick, PLAIN_BLUE, trash, V } from './helpers.ts';
import { PLAIN_PURPLE, STAGE2, STAGE5, STAGE6 } from './helpers-op18.ts';

const ID = 'OP18-072';
const board = (stage: string | null, played = true, blocker = false) =>
  game(
    {
      leader: PLAIN_PURPLE,
      characters: [{ card: ID, playedThisTurn: played }],
      ...(stage ? { stage } : {}),
    },
    { leader: PLAIN_BLUE, characters: [V.c5] },
    blocker ? { turn: 4, activePlayer: 'p2' } : {},
  );
const activate = (g: ReturnType<typeof board>) => {
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'minus' });
  const st = g.zone('p1', 'stage')[0]?.instance;
  if (st && g.legal().some((a) => a.type === 'pick' && a.choice === st)) pick(g, [st]);
};
const canAct = (g: ReturnType<typeof board>) =>
  g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID));

describe('OP18-072 The Franky Family', () => {
  it('has [Blocker]', () => {
    const g = board(null, false, true);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
    expect(g.legal()).toContainEqual(
      expect.objectContaining({ type: 'block', blocker: g.find('p1', 'characters', ID) }),
    );
  });

  it('K.O. your Stage on the turn it was played: up to 1 opponent Character −3000 this turn', () => {
    const g = board(STAGE5);
    activate(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(trash(g, 'p1')).toEqual([STAGE5]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(4000);
  });

  it("on a later turn the Stage is still K.O.'d, nothing else happens, and the Once Per Turn is spent", () => {
    const g = board(STAGE5, false);
    activate(g);
    expect(trash(g, 'p1')).toEqual([STAGE5]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    expect(canAct(g)).toBe(false);
  });

  it('needs a Stage with a cost of 5 or less', () => {
    expect(canAct(board(STAGE6))).toBe(false);
    expect(canAct(board(null))).toBe(false);
    expect(canAct(board(STAGE2))).toBe(true);
  });
});

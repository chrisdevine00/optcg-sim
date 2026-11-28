/** OP18-066 Zambai. OP-18 wave G2 (K.O. cost on your own Stage). */
import { describe, expect, it } from 'vitest';
import { game, pick, PLAIN_BLUE, trash } from './helpers.ts';
import { PLAIN_PURPLE, STAGE5, STAGE6 } from './helpers-op18.ts';

const ID = 'OP18-066';
const board = (stage: string | null, played = true) =>
  game(
    {
      leader: PLAIN_PURPLE,
      characters: [{ card: ID, playedThisTurn: played }],
      ...(stage ? { stage } : {}),
    },
    { leader: PLAIN_BLUE },
  );
const canAct = (g: ReturnType<typeof board>) =>
  g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID));
const canAttack = (g: ReturnType<typeof board>) =>
  g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID));

describe('OP18-066 Zambai', () => {
  it('K.O. your cost 5 or less Stage: it gains [Rush] and can attack the turn it was played', () => {
    const g = board(STAGE5);
    expect(canAttack(g)).toBe(false);
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'rush' });
    if (g.decider === 'p1' && g.legal().some((a) => a.type === 'pick'))
      pick(g, [g.find('p1', 'stage', STAGE5)]);
    expect(trash(g, 'p1')).toEqual([STAGE5]);
    expect(g.events.some((e) => e.type === 'KO')).toBe(true);
    expect(canAttack(g)).toBe(true);
  });

  it('cannot be activated without a Stage of cost 5 or less', () => {
    expect(canAct(board(null))).toBe(false);
    expect(canAct(board(STAGE6))).toBe(false);
  });

  it('no Once Per Turn: with a second Stage it could pay again (only one Stage fits on the field)', () => {
    const g = board(STAGE5);
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'rush' });
    if (g.decider === 'p1' && g.legal().some((a) => a.type === 'pick'))
      pick(g, [g.find('p1', 'stage', STAGE5)]);
    expect(canAct(g)).toBe(false); // no Stage left to pay with
  });
});

/** OP18-077 White Hobby Horse 1. */
import { describe, expect, it } from 'vitest';
import { candidates } from './helpers-a10g1.ts';
import { game, pick, PLAIN_BLUE, V } from './helpers.ts';
import { stageOnPlay } from './helpers-op18-stage.ts';
import { PLAIN_PURPLE, SHC3, W7 } from './helpers-op18.ts';

const ID = 'OP18-077';
const board = () =>
  game(
    {
      leader: PLAIN_PURPLE,
      stage: ID,
      characters: [
        { card: SHC3, playedThisTurn: true },
        { card: W7, playedThisTurn: true },
      ],
    },
    { leader: PLAIN_BLUE, characters: [{ card: V.c1, rested: true }] },
  );
const attacks = (g: ReturnType<typeof board>, card: string) =>
  g.legal().filter((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', card));

describe('OP18-077 White Hobby Horse 1', () => {
  it('[On Play] draws 1, then adds up to 1 rested DON!!', () => stageOnPlay(ID));

  it('rest it: a {Straw Hat Crew} Character gains [Rush: Character] (attacks Characters, not the Leader)', () => {
    const g = board();
    expect(attacks(g, SHC3)).toEqual([]);
    g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'rush' });
    expect(candidates(g)).toEqual([g.find('p1', 'characters', SHC3)]);
    pick(g, [g.find('p1', 'characters', SHC3)]);
    const targets = attacks(g, SHC3).map((a) => (a as { target: string }).target);
    expect(targets).toEqual([g.find('p2', 'characters', V.c1)]);
    expect(attacks(g, W7)).toEqual([]);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
  });

  it('a rested Stage cannot be activated', () => {
    const g = board();
    g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'rush' });
    pick(g, [g.find('p1', 'characters', SHC3)]);
    expect(
      g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'stage', ID)),
    ).toBe(false);
  });
});

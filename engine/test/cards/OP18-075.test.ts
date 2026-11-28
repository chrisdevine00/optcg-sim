/** OP18-075 Thousand Sunny. */
import { describe, expect, it } from 'vitest';
import { candidates } from './helpers-a10g1.ts';
import { don, game, pick, PLAIN_BLUE } from './helpers.ts';
import { stageOnPlay } from './helpers-op18-stage.ts';
import { PLAIN_PURPLE, SHC3, SHC5, SHC6, W7 } from './helpers-op18.ts';

const ID = 'OP18-075';
const board = (active = 2, stageRested = false) =>
  game(
    {
      leader: PLAIN_PURPLE,
      stage: { card: ID, rested: stageRested },
      characters: [
        { card: SHC5, rested: true },
        { card: SHC6, rested: true },
        { card: W7, rested: true },
        SHC3,
      ],
      costArea: { active, rested: 0 },
    },
    { leader: PLAIN_BLUE },
  );
const canAct = (g: ReturnType<typeof board>) =>
  g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'stage', ID));

describe('OP18-075 Thousand Sunny', () => {
  it('[On Play] draws 1, then adds up to 1 rested DON!!', () => stageOnPlay(ID));

  it('DON!! −2 and rest it: set a {Straw Hat Crew} Character with 7000 power or less active', () => {
    const g = board();
    g.act({ type: 'activate', card: g.find('p1', 'stage', ID), ability: 'set-active' });
    const offered = candidates(g);
    expect(offered).toContain(g.find('p1', 'characters', SHC5));
    expect(offered).not.toContain(g.find('p1', 'characters', SHC6)); // 8000
    expect(offered).not.toContain(g.find('p1', 'characters', W7)); // not {Straw Hat Crew}
    pick(g, [g.find('p1', 'characters', SHC5)]);
    expect(g.card(g.find('p1', 'characters', SHC5)).rested).toBe(false);
    expect(g.card(g.find('p1', 'stage', ID)).rested).toBe(true);
    expect(don(g, 'p1').deck).toBe(10);
  });

  it('needs 2 DON!! to return and an active Stage', () => {
    expect(canAct(board(1))).toBe(false);
    expect(canAct(board(2, true))).toBe(false);
    expect(canAct(board(2))).toBe(true);
  });
});

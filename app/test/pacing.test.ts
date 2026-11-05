/** board.md §5.2 compression rule, as built (DECISIONS 2026-11-05). */
import { describe, expect, it } from 'vitest';
import { aiDwell } from '../src/play/game/controller.ts';

describe('the AI turn’s non-attack dwell', () => {
  it('holds 400 ms until the turn has spent 6 s on the board, then 240 ms', () => {
    expect(aiDwell(0, 1)).toBe(400);
    expect(aiDwell(5999, 1)).toBe(400);
    expect(aiDwell(6000, 1)).toBe(240);
    expect(aiDwell(9000, 2)).toBe(240);
    expect(aiDwell(9000, 4)).toBe(240);
  });

  it('never compresses in Step mode or below 1×', () => {
    expect(aiDwell(20_000, 'step')).toBe(400);
    expect(aiDwell(20_000, 0.5)).toBe(400);
  });
});

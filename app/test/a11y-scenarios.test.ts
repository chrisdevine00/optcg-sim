/** The screen-reader pass scenarios (accessibility.md §11.2) start, and use only scripted cards. */
import { describe, expect, it } from 'vitest';
import { GameController } from '../src/play/game/controller.ts';
import { A11Y_SCENARIOS } from '../src/play/setup/a11y-scenarios.ts';
import { scenarioCardIds } from '../src/play/setup/scenarios.ts';
import { SCRIPTED } from '../src/cards/scripts.ts';
import { cardMap } from './support.ts';

describe('a11y scenarios', () => {
  for (const [name, sc] of Object.entries(A11Y_SCENARIOS)) {
    it(`${name} is a valid position made of scripted cards`, () => {
      const unscripted = scenarioCardIds(sc).filter((id) => !SCRIPTED.has(id));
      expect(unscripted).toEqual([]);
      const { mode: _m, ...spec } = sc;
      const ctl = new GameController(
        cardMap(),
        { scenario: spec },
        {
          mode: 'hotseat',
          human: 'p1',
          names: { p1: 'You', p2: 'Kaido' },
          tier: 'rookie',
          autoSkip: true,
          alwaysSkip: false,
          speed: 'step',
        },
      );
      const v = ctl.view();
      expect(v.turn.number).toBe(spec.turn);
      expect(v.decision?.kind).toBe('main');
    });
  }
});

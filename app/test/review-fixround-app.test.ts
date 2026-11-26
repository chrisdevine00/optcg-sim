/**
 * M8 fix round (app): the copy of a "Not fully checked" marker (R9), the mulligan flag's guide label
 * everywhere (R1).
 */
import { describe, expect, it } from 'vitest';
import { LARGE_COPY, LIVENESS_MAX_ACTIONS, liveness, staleCopyOf } from '../src/store/staleness.ts';
import { sessionRecord } from './store-support.ts';
import type { ReviewFlag } from '@optcg/ai';
import {
  DEEPER_LABEL,
  actorsOf,
  certaintyOf,
  contextOf,
  flagName,
  markerCopy,
} from '../src/play/review/model.ts';

const mulligan = {
  id: 'mulligan:0:1',
  kind: 'mulligan',
  turn: 0,
  player: 'p1',
  severity: 'minor',
  certainty: 'any-hand',
  explanation: { certainty: 'any-hand' },
} as unknown as ReviewFlag;
const lethal = { ...mulligan, kind: 'missed-lethal', turn: 9 } as unknown as ReviewFlag;

describe('R1: a mulligan flag is the guide, never "Holds whatever they held"', () => {
  it('uses the guide context for a mulligan and the review context for the rest', () => {
    expect(contextOf(mulligan)).toBe('guide');
    expect(contextOf(lethal)).toBe('review');
    expect(certaintyOf(mulligan, 'Rocks')).toBe('From the Rocks guide (sourced)');
    expect(certaintyOf(lethal, 'Rocks')).toBe('Holds whatever they held');
  });

  it('names the guide in the flag’s accessible name', () => {
    const a = actorsOf([], 'p1', 'Kaido', 'Rocks');
    expect(flagName(mulligan, a)).toBe(
      'Start of the game: mulligan, minor, from the rocks guide (sourced).',
    );
  });
});

describe('R9: the copy of a marker', () => {
  it('a deadline marker is about time, and Analyse now settles it', () => {
    for (const reason of ['deadline', 'not-run'] as const) {
      const c = markerCopy(reason, false);
      expect(c.body).toBe('We stopped before checking this turn.');
      expect(c.button).toBe('now');
    }
  });

  it('a search-incomplete marker never says it ran out of time, and says why', () => {
    const c = markerCopy('search-incomplete', false);
    expect(c.lead).toBe('Not fully checked.');
    expect(c.body).toBe('We couldn’t settle this turn: too many possible hands to check.');
    expect(`${c.lead} ${c.body}`).not.toMatch(/time/i);
    expect(c.button).toBe('deeper');
    expect(DEEPER_LABEL).toMatch(/half a minute/);
  });

  it('Analyse deeper is offered once per turn, then it says it did not help', () => {
    const c = markerCopy('search-incomplete', true);
    expect(c.button).toBeNull();
    expect(c.body).toContain('Looking deeper did not settle it either.');
  });
});

describe('R12: opening a huge record does not replay it on the main thread', () => {
  it('a record over the cap is read-only with its own message, without a replay', () => {
    const rec = sessionRecord(21);
    const huge = {
      ...rec,
      actions: Array.from({ length: LIVENESS_MAX_ACTIONS + 1 }, () => rec.actions[0]!),
    };
    let asked = 0;
    const l = liveness(huge, () => {
      asked++;
      return undefined;
    });
    expect(l).toMatchObject({ live: false, reason: 'large' });
    expect(asked).toBe(0);
    expect(staleCopyOf(l)).toBe(LARGE_COPY);
    expect(LARGE_COPY).not.toMatch(/older version/);
  });

  it('an ordinary game is still replayed', () => {
    const rec = sessionRecord(21);
    expect(rec.actions.length).toBeLessThan(LIVENESS_MAX_ACTIONS);
  });
});

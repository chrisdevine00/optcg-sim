/**
 * M8-R8 follow-ups in the app: a stored or imported record keeps its `final` (so `verifyReplay` checks
 * the last turn and the result), and a rewound session record carries the rewound position's `final`.
 */
import { describe, expect, it } from 'vitest';
import { verifyReplay } from '@optcg/engine';
import { sanitizeGame } from '../src/store/validate.ts';
import { lookup, sessionRecord, storedGame } from './store-support.ts';

describe('a record keeps its final state through the store', () => {
  it('sanitizeGame copies final, and the copy verifies with the final checked', () => {
    const rec = sessionRecord(11);
    expect(rec.final).toBeDefined();
    const clean = sanitizeGame(JSON.parse(JSON.stringify(storedGame('a', 1, rec)))).record;
    expect(clean.final).toEqual(rec.final);
    const v = verifyReplay(clean, lookup);
    expect(v).toMatchObject({ ok: true });
    expect((v as { finalChecked?: boolean }).finalChecked).not.toBe(false);
  });

  it('a truncated imported record is refused once final is kept', () => {
    const rec = sessionRecord(11);
    const cut = { ...rec, actions: rec.actions.slice(0, -1) };
    // The final's actionIndex is past the end: the validator refuses the game outright.
    expect(() => sanitizeGame(JSON.parse(JSON.stringify(storedGame('b', 1, cut))))).toThrow();
    // A cut that also edits the index to fit is caught by verifyReplay's final hash.
    const edited = {
      ...cut,
      snapshots: cut.snapshots.filter((x) => x.actionIndex <= cut.actions.length),
      final: { ...rec.final!, actionIndex: cut.actions.length },
    };
    const clean = sanitizeGame(JSON.parse(JSON.stringify(storedGame('b2', 1, edited)))).record;
    expect(verifyReplay(clean, lookup).ok).toBe(false);
  });

  it('a forged final result is rebuilt from known fields only', () => {
    const rec = sessionRecord(11);
    const forged = {
      ...rec,
      final: { ...rec.final!, result: { winner: 'p2', reason: 'x', extra: 1 } },
    };
    const clean = sanitizeGame(
      JSON.parse(JSON.stringify(storedGame('c', 1, forged as unknown as typeof rec))),
    ).record;
    expect(clean.final!.result).toEqual({ winner: 'p2', reason: 'x' });
  });
});

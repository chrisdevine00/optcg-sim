/** The deck builder's model (M6, flows F17): check rows, coverage, grouping, editing. */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Card, SetFile } from '@optcg/cards';
import {
  addCopy,
  changeLine,
  checkRows,
  coverageLine,
  deckCoverage,
  fitsLeader,
  groupByCost,
  issuesOf,
  legalIn,
  removeCopy,
} from '../src/decks/model.ts';
import type { SavedDeck } from '../src/decks/store.ts';
import { DECKS } from '../src/play/setup/decks.ts';

const byId = new Map<string, Card>();
const dir = new URL('../../cards/data/sets/', import.meta.url);
for (const f of readdirSync(dir))
  for (const c of (JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SetFile).cards)
    byId.set(c.id, c);
const lookup = (id: string) => byId.get(id);

const rocks = DECKS.find((d) => d.leader === 'OP17-039')!;
/** A Blue Character rotated out of Standard (block 1). */
const ROTATED = [...byId.values()].find(
  (c) =>
    c.category === 'Character' &&
    c.colors.join() === 'Blue' &&
    c.legality.standard.status === 'rotated',
)!.id;
const deck = (p: Partial<SavedDeck> = {}): SavedDeck => ({
  id: 'saved:t',
  name: 'Test',
  leader: rocks.spec.leader,
  main: rocks.spec.main.slice(),
  format: 'standard',
  art: {},
  updatedAt: '2026-11-23T00:00:00Z',
  ...p,
});

describe('deck builder model', () => {
  it('a meta list passes every check row', () => {
    const d = deck();
    const rows = checkRows(d, issuesOf(d, lookup));
    expect(rows.map((r) => r.ok)).toEqual([true, true, true, true, true]);
    expect(rows[0]!.label).toBe('50 cards (50)');
  });
  it('a fifth copy fails the size and copies rows, naming the card', () => {
    const id = rocks.spec.main.find((x) => rocks.spec.main.filter((y) => y === x).length === 4)!;
    const d = addCopy(deck(), id);
    const rows = checkRows(d, issuesOf(d, lookup));
    expect(rows[0]).toMatchObject({ ok: false, label: '50 cards (51)' });
    expect(rows[1]).toMatchObject({ ok: false, rule: 'CR 5-1-2-3', cards: [id] });
    expect(removeCopy(d, id).main).toEqual(rocks.spec.main);
  });
  it('a rotated card fails the Standard row only, and passes in Extra Regulation', () => {
    const d = deck({ main: [...rocks.spec.main.slice(0, 49), ROTATED] });
    const std = checkRows(d, issuesOf(d, lookup));
    expect(std.map((r) => r.ok)).toEqual([true, true, true, true, false]);
    const ex = deck({ ...d, format: 'extra' });
    expect(checkRows(ex, issuesOf(ex, lookup)).every((r) => r.ok)).toBe(true);
  });
  it('coverage counts copies and names (F17 step 3)', () => {
    const c = deckCoverage(rocks.spec.main, lookup);
    expect(c).toMatchObject({ copies: 50, copiesFull: 50, statsOnly: [] });
    expect(coverageLine(c)).toMatch(/^Automated: 50 of 50 cards \(100%\) · \d+ of \d+ card names$/);
    const withOld = deckCoverage([...rocks.spec.main.slice(0, 49), ROTATED], lookup);
    if (withOld.statsOnly.length) expect(withOld.copiesFull).toBe(49);
  });
  it('groups by cost, ascending, each row with its count', () => {
    const g = groupByCost(rocks.spec.main, lookup);
    const costs = g.map((x) => Number(x.label.replace('Cost ', '')));
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    expect(g.flatMap((x) => x.rows).reduce((n, r) => n + r.count, 0)).toBe(50);
  });
  it('the browser default: Leaders only until one is chosen, then its colours', () => {
    const leader = lookup('OP17-039')!;
    expect(fitsLeader(leader, undefined)).toBe(true);
    expect(fitsLeader(lookup(rocks.spec.main[0]!)!, undefined)).toBe(false);
    expect(fitsLeader(lookup(rocks.spec.main[0]!)!, leader)).toBe(true);
    expect(fitsLeader(leader, leader)).toBe(false);
    expect(legalIn(lookup('OP14-020')!, 'standard')).toBe(false);
  });
  it('the polite line names the card, its copies and the deck size', () => {
    const id = rocks.spec.main[0]!;
    const d = removeCopy(deck(), id);
    expect(changeLine('Removed', lookup(id), id, d)).toMatch(
      new RegExp(
        `^Removed ${lookup(id)!.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\. \\d of 4 copies\\. Deck 49 of 50\\.$`,
      ),
    );
  });
  it("a Leader's deck rule (OP12-001, M6b wave 2) is a check row only when the deck breaks it", () => {
    const ok = deck();
    expect(checkRows(ok, issuesOf(ok, lookup)).map((r) => r.label)).not.toContain(
      "Leader's deck-building rule",
    );
    const dear = [...byId.values()].find(
      (c) => c.category === 'Character' && c.colors.join() === 'Red' && (c.cost ?? 0) >= 5,
    )!;
    const d = deck({ leader: 'OP12-001', main: [...rocks.spec.main.slice(0, 49), dear.id] });
    const row = checkRows(d, issuesOf(d, lookup)).find(
      (r) => r.label === "Leader's deck-building rule",
    )!;
    expect(row.ok).toBe(false);
    expect(row.cards).toContain(dear.id);
  });
});

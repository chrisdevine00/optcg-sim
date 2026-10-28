/**
 * Diff report against the previous snapshot (PROMPT.md "cards:update" step 4): new cards, changed text
 * (errata), removed cards, and changed stats. Changed text on a card that has an effect script fails the
 * run until a person re-verifies the script.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Card } from '../src/schema.ts';

export interface TextChange {
  id: string;
  field: 'effectText' | 'triggerText' | 'name';
  before: string | null;
  after: string | null;
}

export interface DiffReport {
  added: string[];
  removed: string[];
  textChanged: TextChange[];
  statsChanged: { id: string; fields: string[] }[];
  /** Reasons the run must fail. */
  failures: string[];
}

const STAT_FIELDS = [
  'category',
  'colors',
  'cost',
  'power',
  'counter',
  'life',
  'attributes',
  'types',
] as const;

export function diffSnapshots(
  prev: Map<string, Card> | null,
  next: Map<string, Card>,
  scripted: Set<string>,
): DiffReport {
  const report: DiffReport = {
    added: [],
    removed: [],
    textChanged: [],
    statsChanged: [],
    failures: [],
  };
  if (!prev) {
    report.added = [...next.keys()];
    return report;
  }
  for (const [id, card] of next) {
    const old = prev.get(id);
    if (!old) {
      report.added.push(id);
      continue;
    }
    for (const field of ['name', 'effectText', 'triggerText'] as const) {
      if (old[field] !== card[field]) {
        report.textChanged.push({ id, field, before: old[field], after: card[field] });
        if (scripted.has(id) && field !== 'name') {
          report.failures.push(`${id}: ${field} changed on a scripted card; re-verify its script`);
        }
      }
    }
    const fields = STAT_FIELDS.filter((f) => JSON.stringify(old[f]) !== JSON.stringify(card[f]));
    if (fields.length) report.statsChanged.push({ id, fields: [...fields] });
  }
  for (const id of prev.keys()) {
    if (next.has(id)) continue;
    report.removed.push(id);
    if (scripted.has(id)) report.failures.push(`${id}: removed upstream but has a script`);
  }
  return report;
}

export function formatDiff(r: DiffReport, max = 20): string {
  const lines: string[] = [];
  const list = (ids: string[]) =>
    ids.slice(0, max).join(', ') + (ids.length > max ? `, … (+${ids.length - max})` : '');
  lines.push(`New cards: ${r.added.length}${r.added.length ? ` (${list(r.added)})` : ''}`);
  lines.push(
    `Removed cards: ${r.removed.length}${r.removed.length ? ` (${list(r.removed)})` : ''}`,
  );
  lines.push(`Changed text (errata): ${r.textChanged.length}`);
  for (const c of r.textChanged.slice(0, max)) {
    lines.push(
      `  ${c.id} ${c.field}:`,
      `    - ${c.before ?? '(none)'}`,
      `    + ${c.after ?? '(none)'}`,
    );
  }
  lines.push(`Changed stats or types: ${r.statsChanged.length}`);
  for (const c of r.statsChanged.slice(0, max)) lines.push(`  ${c.id}: ${c.fields.join(', ')}`);
  for (const f of r.failures) lines.push(`FAIL ${f}`);
  return lines.join('\n');
}

/** Card numbers that have an effect script: `cards/effects/<SET>/<CARD-ID>.ts`. */
export function loadScriptIndex(dir: string): Set<string> {
  const ids = new Set<string>();
  if (!existsSync(dir)) return ids;
  for (const set of readdirSync(dir)) {
    const sub = join(dir, set);
    if (!statSync(sub).isDirectory()) continue;
    for (const f of readdirSync(sub)) {
      const m = /^([A-Z]+\d*-\d{3})\.ts$/.exec(f);
      if (m) ids.add(m[1]!);
    }
  }
  return ids;
}

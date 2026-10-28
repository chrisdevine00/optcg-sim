/**
 * Hand-verified overrides (`cards/overrides/<CARD-ID>.json`, ADR 0007, effect-dsl E-D7). Each correction
 * carries the upstream value it replaced, so the run can warn when upstream starts to agree or changes
 * again, and printed keywords are checked against the text on every run.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  Block,
  Card,
  CardField,
  Keyword,
  TextFix,
  VerificationSource,
} from '../src/schema.ts';
import { printedKeywords } from './normalize.ts';

export type OverridableField = Exclude<CardField, 'effectText' | 'triggerText'>;

export interface FieldOverride {
  value: unknown;
  /** The normalized upstream value when the override was written. */
  upstream: unknown;
  source: string;
}

export interface TextPatch {
  field: 'effectText' | 'triggerText';
  find: string;
  replace: string;
  source: string;
  note?: string;
}

export interface Override {
  id: string;
  /** True only when every game field (stats, types, text) was checked against the sources. */
  verified: boolean;
  sources: VerificationSource[];
  /** Printed keywords (E-D7). Omitted means "not verified"; [] means "verified: none". */
  keywords?: Keyword[];
  fields?: Partial<Record<OverridableField, FieldOverride>>;
  textPatches?: TextPatch[];
  block?: { value: Block; source: string };
  artFocus?: { x: number; y: number };
  note?: string;
}

export interface OverrideResult {
  warnings: string[];
  fatals: string[];
  /** Fields this override supplies, which clear assembly fatals for those fields. */
  supplies: Set<CardField>;
}

export function loadOverrides(dir: string): Map<string, Override> {
  const out = new Map<string, Override>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    const o = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Override;
    if (`${o.id}.json` !== f) throw new Error(`${f}: id ${o.id} does not match the file name`);
    out.set(o.id, o);
  }
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const show = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

/** Applies one override to a card in place. */
export function applyOverride(card: Card, o: Override): OverrideResult {
  const warnings: string[] = [];
  const fatals: string[] = [];
  const supplies = new Set<CardField>();
  const fixes: TextFix[] = [];

  for (const [field, f] of Object.entries(o.fields ?? {}) as [OverridableField, FieldOverride][]) {
    const current = card[field];
    if (!same(current, f.upstream)) {
      warnings.push(
        same(current, f.value)
          ? `${field}: upstream now agrees with the override (${show(f.value)}); the override can go`
          : `${field}: upstream changed again (${show(f.upstream)} -> ${show(current)}); re-verify`,
      );
    }
    if (!same(current, f.value)) {
      fixes.push({
        field,
        kind: 'override',
        from: show(current),
        to: show(f.value),
        source: f.source,
      });
    }
    (card as unknown as Record<string, unknown>)[field] = f.value;
    supplies.add(field);
  }

  for (const p of o.textPatches ?? []) {
    const text = card[p.field] ?? '';
    if (text.includes(p.find)) {
      card[p.field] = text.replace(p.find, p.replace);
      fixes.push({
        field: p.field,
        kind: 'override',
        from: p.find,
        to: p.replace,
        source: p.source,
      });
    } else if (text.includes(p.replace)) {
      warnings.push(`${p.field}: upstream now reads "${p.replace}"; the patch can go`);
    } else {
      fatals.push(
        `${p.field}: patch "${p.find}" no longer applies; upstream text changed, re-verify`,
      );
    }
  }

  if (o.keywords) {
    const printed = printedKeywords(card.effectText);
    if (!same([...printed].sort(), [...o.keywords].sort())) {
      fatals.push(
        `keywords: override lists [${o.keywords.join(', ')}] but the text's keyword lines are [${printed.join(', ')}] (E-D7); re-verify`,
      );
    }
    card.keywords = [...o.keywords];
  }
  if (o.block) card.block = o.block.value;
  if (o.artFocus) card.artFocus = o.artFocus;
  card.textFixes.push(...fixes);
  if (o.verified) {
    if (!o.sources.length) fatals.push('verified without a source');
    card.verified = true;
    card.verifiedBy = o.sources;
  }
  return { warnings, fatals, supplies };
}

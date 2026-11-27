/**
 * M9 WP5: the rules reference's two sources, parsed. The counts are asserted so a research file that
 * changes shape fails here, loudly, instead of quietly dropping entries; the `[engine note]` clauses
 * and the `Engine test` paragraphs never reach an entry.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  citedRules,
  digestItems,
  parseDigest,
  parseRulings,
  stripEngineNotes,
} from '../src/rules/parse.ts';
import { asOfOf, parseGlossary, termForms } from '../src/rules/index.ts';

const digestText = readFileSync('docs/research/rules-digest.md', 'utf8');
const rulingsText = readFileSync('docs/research/rulings.md', 'utf8');
const glossaryText = readFileSync('docs/content/glossary.md', 'utf8');
const digest = parseDigest(digestText);
const rulings = parseRulings(rulingsText);

describe('the digest', () => {
  it('has 137 numbered items, in order, each under a section', () => {
    expect(digest).toHaveLength(137);
    expect(digest.map((e) => e.id)).toEqual(Array.from({ length: 137 }, (_, i) => `item/${i + 1}`));
    expect(new Set(digest.map((e) => e.section)).size).toBe(16);
    for (const e of digest) {
      expect(e.kind).toBe('digest');
      expect(e.title.length, e.id).toBeGreaterThan(3);
      // Item 73 is only an engine note: nothing is left of it, and the reference does not list it.
      if (e.id !== 'item/73') expect(e.text.length, e.id).toBeGreaterThan(10);
    }
    expect(digest[72]!.text).toBe('');
  });

  it('drops every [engine note] clause and keeps the rule', () => {
    expect(digestText).toContain('[engine note]');
    for (const e of digest) expect(e.text, e.id).not.toMatch(/engine note/i);
    // Item 88: the note after the CR cite is gone, the rule before it is whole.
    const item88 = digest[87]!;
    expect(item88.text).toContain(
      'The target is the opponent’s Leader or one rested Character'.replace('’', "'"),
    );
    expect(item88.text).not.toContain('per-turn limit');
    // Item 10 is a rule followed by a note: only the rule is left.
    expect(digest[9]!.text).toMatch(/not performed\. \(CR 1-3-2-1\)$/);
  });

  it('reads the CR numbers and item references an item cites', () => {
    expect(digest[93]!.cr).toContain('7-1-4-1');
    expect(digest[93]!.cr).toContain('7-1-4-1-1-3');
    expect(digest[2]!.cr).toEqual(expect.arrayContaining(['1-2-1-1-1', '1-2-2-2', '9-2-1-2']));
    // "items 131" style references become routes.
    expect(digest.flatMap((e) => e.cr).some((c) => c.startsWith('item/'))).toBe(true);
  });

  it('every item’s section is named by the digest', () => {
    const sections = digest.map((e) => e.section);
    expect(sections[0]).toMatch(/^A\. Game structure/);
    expect(sections.at(-1)).toMatch(/^P\. Tournament/);
  });
});

describe('the rulings', () => {
  it('has 50 rulings (RL-01 to RL-37 and RL-40 to RL-52: RL-38 and RL-39 do not exist)', () => {
    expect(rulings).toHaveLength(50);
    const ids = rulings.map((r) => r.id);
    expect(ids[0]).toBe('RL-01');
    expect(ids.at(-1)).toBe('RL-52');
    expect(ids).not.toContain('RL-38');
    expect(ids).not.toContain('RL-39');
    expect(new Set(ids).size).toBe(50);
  });

  it('gives each a question, an answer, a confidence and sources', () => {
    for (const r of rulings) {
      expect(r.kind).toBe('ruling');
      expect(r.question, r.id).toBeTruthy();
      expect(r.text.length, r.id).toBeGreaterThan(20);
      expect(['official explicit', 'official by inference', 'unresolved'], r.id).toContain(
        r.confidence,
      );
      expect(r.sources.length, r.id).toBeGreaterThan(0);
      expect(r.section, r.id).toBeTruthy();
    }
    expect(rulings.find((r) => r.id === 'RL-30')!.confidence).toBe('unresolved');
    expect(rulings.find((r) => r.id === 'RL-04')!.confidence).toBe('official by inference');
    // A confidence line that says more than its label keeps the whole line.
    expect(rulings.find((r) => r.id === 'RL-44')!.confidenceNote).toContain('reveal handling');
  });

  it('never carries the Engine test paragraph or an engine note', () => {
    expect(rulingsText).toContain('**Engine test:**');
    for (const r of rulings) {
      expect(r.text, r.id).not.toMatch(/Engine test|engine note/i);
      expect(r.question ?? '', r.id).not.toMatch(/Engine test/i);
    }
  });

  it('RL-18 is the Blocker timing ruling, with its answer in order', () => {
    const r = rulings.find((x) => x.id === 'RL-18')!;
    expect(r.title).toMatch(/^Blocker timing/);
    expect(r.section).toMatch(/^E\. Battle/);
    expect(r.text).toMatch(/Block Step/);
    expect(r.cr).toEqual(expect.arrayContaining(['7-1-2-1', '7-1-3-1', '10-1-4-1']));
  });
});

describe('the parsers fail loudly on a changed file', () => {
  it('a digest without its sections throws', () => {
    expect(() => digestItems('# nothing here')).toThrow(/Digest/);
  });
  it('removing a digest item changes the count the test above pins', () => {
    const fewer = digestText.replace(/^137\. .*$/m, '');
    expect(parseDigest(fewer)).toHaveLength(136);
  });
  it('removing a ruling changes its count', () => {
    const fewer = rulingsText.replace(/^### RL-52 /m, '## ');
    expect(parseRulings(fewer)).toHaveLength(49);
  });
});

describe('citations', () => {
  it('reads CR runs, ranges and the typo form', () => {
    expect(citedRules('(CR 7-1-1-3, 10-2-16-1; QA-GR "x")')).toEqual(['7-1-1-3', '10-2-16-1']);
    expect(citedRules('CR 7-1-2-1..7-1-2-3')).toEqual(['7-1-2-1', '7-1-2-2', '7-1-2-3']);
    expect(citedRules('CR 8.6.3 and 8-6-1-1')).toEqual(['8-6-3', '8-6-1-1']);
    expect(citedRules('see item 97 and items 3 and 4')).toEqual(['item/97', 'item/3', 'item/4']);
    expect(citedRules('no rule here, version 1.2')).toEqual([]);
  });
  it('strips a note to the end of its line only', () => {
    expect(stripEngineNotes('a rule. **[engine note]** a note\nnext line')).toBe(
      'a rule.\nnext line',
    );
  });
});

describe('the glossary', () => {
  it('reads the rules terms and leaves the strategy slang out', () => {
    const g = parseGlossary(glossaryText);
    const terms = g.map((t) => t.term);
    expect(terms).toContain('[Blocker]');
    expect(terms).toContain('Ties go to the attacker');
    expect(terms).not.toContain('Tempo');
    expect(g.length).toBeGreaterThan(80);
    expect(termForms('Life (value)')).toEqual(['Life']);
    expect(termForms("[Your Turn] / [Opponent's Turn]")).toEqual([
      '[Your Turn]',
      "[Opponent's Turn]",
    ]);
  });
  it('dates come from the files', () => {
    expect(asOfOf(digestText)).toBe('2026-10-28');
    expect(asOfOf(rulingsText)).toBe('2026-10-28');
  });
});

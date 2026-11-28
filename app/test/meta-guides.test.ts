/**
 * M9 WP1: the guide parser over all 14 archetype files, the sources it resolves through, and the
 * checks that make a guide edit fail loudly (an unknown tag, a missing opponent row).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  knownTag,
  loadGuides,
  parseGuide,
  parseSources,
  parseSpans,
  SOURCES,
} from '../src/meta/guides.ts';
import type { Guide } from '../src/meta/types.ts';

const DIR = fileURLToPath(new URL('../../docs/content/archetypes/', import.meta.url));
const FILES = readdirSync(DIR).filter((f) => f.endsWith('.md'));
const read = (f: string) => readFileSync(DIR + f, 'utf8');
const meta = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../docs/research/meta-lists.json', import.meta.url)),
    'utf8',
  ),
) as { archetypes: { leaderId: string; id: string }[] };
const LEADERS = meta.archetypes.map((a) => a.leaderId);

describe('parseSources', () => {
  it('reads the tag table, with labels and links', () => {
    expect(SOURCES.size).toBeGreaterThan(25);
    const xeb = SOURCES.get('SH-XEB')!;
    expect(xeb.url).toBe('https://www.shonentcg.com/blog/op-17-xebec-deck-guide');
    expect(xeb.label).toMatch(/Xebec Deck Guide/);
    expect(SOURCES.has('CARD')).toBe(true);
    expect(knownTag('CR 6-4-1')).toBe(true);
    expect(knownTag('SH-NOPE')).toBe(false);
  });
});

describe('parseGuide: all 14 files', () => {
  it('has fourteen files, one per archetype in meta-lists.json', async () => {
    expect(FILES.length).toBe(14);
    const guides = await loadGuides();
    expect(guides.map((g) => g.leaderId).sort()).toEqual([...LEADERS].sort());
  });

  for (const f of FILES) {
    describe(f, () => {
      const g: Guide = parseGuide(read(f));
      it('has front matter and the sections in file order', () => {
        expect(g.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(g.confidence).toMatch(/^(low|medium|high)$/);
        expect(g.sources.length).toBeGreaterThan(0);
        expect(g.title).toMatch(/archetype guide$/);
        expect(g.sections.map((s) => s.id)).toEqual([
          'overview',
          'what-the-deck-is-trying-to-do',
          'game-plan-by-turn',
          'defining-cards',
          'mulligan',
          'what-it-is-weak-to',
          'matchups',
          'sourced-lists',
          'playbook-seeds',
        ]);
      });
      it('has 13 opponent rows, every opponent a known leader, never itself', () => {
        expect(g.matchups).toHaveLength(13);
        const opp = g.matchups.map((m) => m.opponent);
        expect(new Set(opp).size).toBe(13);
        for (const o of opp) {
          expect(LEADERS).toContain(o);
          expect(o).not.toBe(g.leaderId);
        }
      });
      it('resolves every tag through sources.md', () => {
        for (const m of g.matchups)
          for (const t of m.tags) expect(knownTag(t), `${f}: [${t}]`).toBe(true);
        for (const s of g.sections)
          for (const b of s.blocks) {
            const runs = b.kind === 'p' ? [b.spans] : b.kind === 'list' ? b.items : b.rows.flat();
            for (const run of runs)
              for (const x of run)
                if (x.kind === 'source') expect(knownTag(x.tag), `${f}: [${x.tag}]`).toBe(true);
          }
      });
      it('has three sourced lists with links, and playbook seeds', () => {
        expect(g.lists.length).toBe(3);
        for (const l of g.lists) {
          expect(l.url).toMatch(/^https:\/\//);
          expect(l.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
        expect(g.playbook.length).toBeGreaterThanOrEqual(3);
      });
      it('marks inference exactly where the plan says so', () => {
        for (const m of g.matchups)
          expect(m.inference).toBe(m.plan.some((s) => s.kind === 'inference'));
      });
    });
  }

  it('a guide edited to use a tag sources.md lacks fails the tag check (revert check)', () => {
    const g = parseGuide(read('OP17-039.md').replace(/\[SH-XEB\]/g, '[SH-ZZZ]'));
    const bad = g.matchups.flatMap((m) => m.tags).filter((t) => !knownTag(t));
    expect(bad).toContain('SH-ZZZ');
  });
  it('a guide with a row removed fails the 13-row check (revert check)', () => {
    const text = read('OP17-039.md')
      .split('\n')
      .filter((l) => !l.startsWith('| OP08-098 Kalgara'))
      .join('\n');
    expect(parseGuide(text).matchups).toHaveLength(12);
  });
  it('a file with no front matter is refused', () => {
    expect(() => parseGuide('# nothing\n')).toThrow(/front matter/);
  });
});

describe('the Rocks guide (OP17-039)', () => {
  const g = parseGuide(read('OP17-039.md'));
  it('reads records with their owner and a source', () => {
    const kaido = g.matchups.find((m) => m.opponent === 'OP17-058')!;
    expect(kaido.record).toEqual({ w: 16, l: 20, text: 'slightly behind' });
    expect(kaido.owner).toBe('OP17-039');
    expect(kaido.tags).toContain('SH-XEB');
    expect(kaido.recordCell).toBe('16-20 (slightly behind)');
    const none = g.matchups.find((m) => m.opponent === 'OP13-001')!;
    expect(none.record).toBeNull();
    expect(none.owner).toBeNull();
  });
  it('reads a record whose note holds a semicolon', () => {
    const rob = parseGuide(read('OP14-041.md')).matchups.find((m) => m.opponent === 'OP17-039')!;
    expect(rob.record).toMatchObject({ w: 8, l: 11 });
    expect(rob.record!.text).toMatch(/reversed/);
  });
  it('keeps the first record when a cell holds two', () => {
    const sabo = parseGuide(read('OP13-004.md')).matchups.find((m) => m.opponent === 'OP17-039')!;
    expect(sabo.record).toMatchObject({ w: 38, l: 63 });
    expect(sabo.recordCell).toContain('10-8 post-ban');
  });
  it('reads the sourced lists table with its link', () => {
    expect(g.lists[0]).toMatchObject({
      date: '2026-10-13',
      players: 64,
      placing: '6th',
      record: '5-1-0',
      player: 'Gefen H',
    });
    expect(g.lists[0]!.url).toMatch(/^https:\/\/play\.limitlesstcg\.com\/tournament\//);
  });
  it('keeps the Game plan table as a table block', () => {
    const plan = g.sections.find((s) => s.id === 'game-plan-by-turn')!;
    const t = plan.blocks.find((b) => b.kind === 'table');
    expect(t && t.kind === 'table' && t.head).toEqual(['Your turn', 'DON!! (1st / 2nd)', 'Plan']);
  });
});

describe('parseSpans', () => {
  const src = parseSources(
    '| [SH-X] | Shonen — https://example.test/x | d | u |\n| [CARD] | Card pages | d | u |',
  );
  it('splits tags, inference marks and plain text; card keywords stay text', () => {
    const s = parseSpans(
      'Use **Stussy** [SH-X] on [Blocker] cards *(inference from [CARD])*.',
      src,
    );
    expect(s).toEqual([
      { kind: 'text', text: 'Use Stussy ' },
      { kind: 'source', tag: 'SH-X', label: 'Shonen', url: 'https://example.test/x' },
      { kind: 'text', text: ' on [Blocker] cards ' },
      { kind: 'inference', note: 'from [CARD]' },
      { kind: 'text', text: '.' },
    ]);
  });
  it('turns a link into its words', () => {
    expect(parseSpans('See [the list](https://example.test/a).', src)).toEqual([
      { kind: 'text', text: 'See the list.' },
    ]);
  });
});

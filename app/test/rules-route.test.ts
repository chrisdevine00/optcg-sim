/**
 * M9 WP5: the rules reference's pages, rendered. The index has a combobox search and the 24 demos; an
 * entry shows its confidence and its sources; an unknown id says so; a CR number nobody cites falls
 * back to the rule around it; `Show me` links name the demo and where to come back to.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEMOS } from '../src/rules/demos/index.ts';
import { resolveRule } from '../src/rules/index.ts';
import { CrView, EntryView, RuleBody, RuleText, titleOfRule } from '../src/rules/RuleEntry.tsx';
import { RulesView } from '../src/rules/RulesRoute.tsx';
import { rulesData } from './rules-support.ts';

const data = rulesData();
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);
const entry = (id: string) => data.byId.get(id)!;

describe('the index', () => {
  const out = html(createElement(RulesView, { data }));

  it('has one h1 that can take focus, and says where the rules come from and when', () => {
    expect(out).toMatch(/<h1 id="page-title" tabindex="-1">Rules reference<\/h1>/);
    expect(out).toContain('as of 2026-10-28');
    expect(out).toContain('v1.2.1');
    expect(out).toContain('the official text wins');
  });

  it('the search is a combobox that controls a listbox and has a polite status', () => {
    expect(out).toMatch(/<input[^>]*role="combobox"/);
    expect(out).toContain('aria-controls="rules-results"');
    expect(out).toContain('aria-expanded="false"');
    expect(out).toContain('aria-autocomplete="list"');
    expect(out).toMatch(/<label[^>]*for="rules-q"[^>]*>Search the rules<\/label>/);
    expect(out).toMatch(/<p id="rules-status" role="status" aria-live="polite"/);
    expect(out).toContain('186 rules. Type a word or a rule number to search them.');
  });

  it('lists every demo, each linking to its board and back to its rule', () => {
    for (const d of DEMOS) {
      expect(out, d.id).toContain(`/rules/${d.id}/show?back=`);
      expect(out, d.id).toContain(d.title.replace(/'/g, '&#x27;'));
    }
    expect(out).toContain('24 short demos');
  });

  it('lists the 186 entries by section, as disclosures', () => {
    expect((out.match(/<details/g) ?? []).length).toBe(
      new Set(data.entries.map((e) => e.section)).size,
    );
    expect(out).toContain('E. Battle');
    expect(out).toContain('/rules/RL-18"');
    expect(out).toContain('/rules/item/94"');
    expect((out.match(/href="[^"]*\/rules\/(item|RL)[^"]*"/g) ?? []).length).toBeGreaterThanOrEqual(
      186,
    );
  });

  it('a search that is passed in lists its results as options', () => {
    const q = html(createElement(RulesView, { data, initial: 'banish' }));
    expect(q).toContain('role="option"');
    expect(q).toContain('aria-expanded="true"');
    expect(q).toMatch(/\d+ results? for “banish”/);
    const none = html(createElement(RulesView, { data, initial: 'blokcer' }));
    expect(none).toContain('No rules match “blokcer”');
    expect(none).not.toContain('role="option"');
  });
});

describe('a ruling', () => {
  const out = html(createElement(EntryView, { data, entry: entry('RL-18') }));

  it('shows the question, the answer, how sure we are and where it comes from', () => {
    expect(out).toMatch(
      /<h1 id="page-title" tabindex="-1">Blocker timing relative to attack triggers and Counter<\/h1>/,
    );
    expect(out).toContain('The question');
    expect(out).toContain('The answer');
    expect(out).toContain('Official explicit.');
    expect(out).toContain('A rule or an official Q&amp;A answers this exact question.');
    expect(out).toContain('Where it comes from');
    expect(out).toContain('QA-OP17 OP17-040');
    expect(out).toContain('Ruling RL-18 · E. Battle');
  });

  it('links its rule numbers to their pages and carries a Show me for its demo', () => {
    expect(out).toContain('/rules/cr/7-1-2-1"');
    expect(out).toContain('/rules/block-before-counter/show?back=RL-18');
    expect(out).toContain('Show me<span class="sr-only">: Block first, Counter after</span>');
  });

  it('an unresolved ruling says it is a best reading', () => {
    const rl30 = html(createElement(EntryView, { data, entry: entry('RL-30') }));
    expect(rl30).toContain('Unresolved.');
    expect(rl30).toContain('our best reading');
  });

  it('a confidence note keeps what the line adds', () => {
    const rl44 = html(createElement(EntryView, { data, entry: entry('RL-44') }));
    expect(rl44).toContain('reveal handling');
  });
});

describe('a digest item', () => {
  const out = html(createElement(EntryView, { data, entry: entry('item/94') }));
  it('names its place, its text in our words and the Comprehensive Rules it rests on', () => {
    expect(out).toContain('Digest item 94 of 137 · J. Battle');
    expect(out).toContain('The rule');
    expect(out).toContain('Comprehensive Rules v1.2.1');
    expect(out).toContain('/rules/cr/7-1-4-1"');
    expect(out).not.toMatch(/engine note/i);
  });
  it('links glossary terms to the search', () => {
    expect(out).toContain('/rules?q=');
  });
  it('shows every demo that is about it', () => {
    expect(out).toContain('/rules/battle-tie/show?back=item%2F94');
  });
});

describe('a CR number', () => {
  it('lists the entries that cite it', () => {
    const r = resolveRule(data, 'cr/7-1-4-1');
    if (r?.kind !== 'cr') throw new Error('expected a CR page');
    const out = html(createElement(CrView, { resolved: r }));
    expect(out).toContain('CR 7-1-4-1');
    expect(out).toContain('cite');
    expect(out).toContain('/rules/item/94"');
    expect(out).toContain('/rules/battle-tie/show?back=cr%2F7-1-4-1');
  });
  it('says so when it falls back to the rule around it', () => {
    const r = resolveRule(data, 'cr/7-1-4-1-1-1-1');
    if (r?.kind !== 'cr') throw new Error('expected a CR page');
    const out = html(createElement(CrView, { resolved: r }));
    expect(out).toContain('No entry cites CR 7-1-4-1-1-1-1 on its own');
    expect(out).toContain('CR 7-1-4-1-1-1');
  });
});

describe('an id that is not a rule', () => {
  it('says there is nothing there and offers the three forms of a rule id', () => {
    const out = html(createElement(RuleBody, { data, id: 'cr/9-9-9' }));
    expect(out).toContain('Rule not found');
    expect(out).toContain('There is nothing for “cr/9-9-9” in the rules reference');
    expect(out).toContain('/rules/cr/7-1-4-1');
    expect(out).toContain('/rules/RL-18');
    expect(out).toContain('/rules/item/17');
    expect(titleOfRule(data, 'nope')).toBe('Rule not found');
  });
});

describe('an entry’s text', () => {
  it('renders paragraphs and lists, and never raw Markdown', () => {
    const out = html(
      createElement(RuleText, { text: 'First.\n1. one\n2. two\n- a\n- b\nLast.', glossary: [] }),
    );
    expect(out).toBe(
      '<p>First.</p><ol><li>one</li><li>two</li></ol><ul><li>a</li><li>b</li></ul><p>Last.</p>',
    );
    for (const e of data.entries) expect(e.text, e.id).not.toMatch(/\*\*|`/);
  });
});

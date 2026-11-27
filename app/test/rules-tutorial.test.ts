/**
 * M9 WP5: the tutorial card cites its rule as a link to the reference (carried F2 step 1). It opens in
 * a new tab, says so in its name, and every rule a step cites has a page to open.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RuleLink } from '../src/rules/RuleLink.tsx';
import { resolveRule } from '../src/rules/index.ts';
import { STEPS } from '../src/tutorial/steps.ts';
import { COPY } from '../src/tutorial/copy.ts';
import { TutorialRule } from '../src/tutorial/TutorialRoute.tsx';
import { rulesData } from './rules-support.ts';

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe('RuleLink', () => {
  it('is a link to the rule that opens in a new tab and says so', () => {
    const out = html(createElement(RuleLink, { cr: '7-1-4-1' }, 'Rule: CR 7-1-4-1'));
    expect(out).toContain('href="/rules/cr/7-1-4-1"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener"');
    // Its accessible name starts with its visible words and adds the new-tab note.
    expect(out.replace(/<[^>]+>/g, '')).toBe('Rule: CR 7-1-4-1 (opens in a new tab)');
  });

  it('without words it names the rule', () => {
    expect(html(createElement(RuleLink, { cr: '3-1-1' })).replace(/<[^>]+>/g, '')).toBe(
      'CR 3-1-1 (opens in a new tab)',
    );
  });
});

describe('the tutorial card’s citation', () => {
  it('shows a link with the right address for each step’s rule', () => {
    for (const step of STEPS) {
      const rule = COPY[`${step.id}.rule`]!;
      const cr = /^CR (\d[\d-]*)$/.exec(rule)![1]!;
      const out = html(createElement(TutorialRule, { rule }));
      expect(out, step.id).toContain(`href="/rules/cr/${cr}"`);
      expect(out, step.id).toContain('target="_blank"');
      expect(out.replace(/<[^>]+>/g, ''), step.id).toBe(`Rule: ${rule} (opens in a new tab)`);
    }
  });

  it('every rule a step cites opens a page in the reference', () => {
    const data = rulesData();
    for (const step of STEPS) {
      const cr = /^CR (\d[\d-]*)$/.exec(COPY[`${step.id}.rule`]!)![1]!;
      expect(resolveRule(data, `cr/${cr}`), `${step.id}: CR ${cr}`).not.toBeNull();
    }
  });

  it('a citation that is not a CR number stays plain text', () => {
    expect(html(createElement(TutorialRule, { rule: 'Rule Manual p.11' }))).toBe(
      'Rule: Rule Manual p.11',
    );
  });
});

/**
 * What an answered item says, for every drill, and the shape of the screens (M9 WP4): equal answer
 * buttons in a fixed order, nothing pre-focused, the answer in words and a shape, never colour alone.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import type { CounterItem, DonItem, LethalItem, MulliganItem } from '@optcg/ai';
import * as ai from '../src/drills/ai.ts';
import { answerFor } from '../src/drills/answers.ts';
import { loadBank } from '../src/drills/banks.ts';
import { MulliganItemScreen } from '../src/drills/items/MulliganItem.tsx';
import { ChooseLineScreen } from '../src/drills/items/ChooseLine.tsx';
import { AnswerScreen, SummaryScreen } from '../src/drills/Screens.tsx';
import { summarise } from '../src/drills/session.ts';
import { ItemTimer } from '../src/drills/timer.ts';
import { cardMap } from './support.ts';

const cards = cardMap() as Map<string, Card>;
const lists = ai.metaListSets();
const timer = new ItemTimer('mulligan', null, () => 0);
const common = {
  index: 2,
  total: 10,
  note: null,
  timer,
  factor: null,
  onFactor: () => undefined,
  onShow: () => undefined,
  onSkip: () => undefined,
  onLeave: () => undefined,
};

describe('answers, drill by drill', () => {
  it('mulligan: the guide’s verdict decides, and the answer is the guide’s explanation', async () => {
    const items = (await loadBank('mulligan', ai, cards)) as MulliganItem[];
    expect(items.length).toBeGreaterThanOrEqual(20);
    const keep = items.find((i) => /^Keep/.test(ai.explainMulliganItem(i, cards, lists).claim))!;
    const right = answerFor(ai, { item: keep }, { kind: 'mulligan', redraw: false }, cards, lists);
    expect(right).toMatchObject({ correct: true, title: 'Correct' });
    expect(right.lines).toEqual(['You chose Keep.', 'The guide says Keep.']);
    expect(right.explanation?.certainty).toBe('any-hand');
    expect(right.archetype).toBeTruthy();
    const wrong = answerFor(ai, { item: keep }, { kind: 'mulligan', redraw: true }, cards, lists);
    expect(wrong).toMatchObject({ correct: false, title: 'Not this time' });
    expect(wrong.lines[1]).toBe('The guide says Keep.');
    const shown = answerFor(ai, { item: keep }, { kind: 'shown' }, cards, lists);
    expect(shown).toMatchObject({ correct: false, title: 'Answer shown' });
  });

  it('lethal: "No lethal" is right on a none item and wrong on one with a line, which is then shown', async () => {
    const items = (await loadBank('lethal', ai, cards)) as LethalItem[];
    const none = items.find((i) => !i.answer.lethal)!;
    const some = items.find((i) => i.answer.lethal)!;
    expect(answerFor(ai, { item: none }, { kind: 'no-lethal' }, cards, lists).correct).toBe(true);
    const miss = answerFor(ai, { item: some }, { kind: 'no-lethal' }, cards, lists);
    expect(miss.correct).toBe(false);
    expect(miss.lines[0]).toContain('You have lethal');
    expect(miss.explanation?.line?.length).toBeGreaterThan(0);
    expect(
      answerFor(ai, { item: some }, { kind: 'board', outcome: 'solved' }, cards, lists).correct,
    ).toBe(true);
    // The header counts their hand; it never names a card.
    expect(miss.lines[1]).toMatch(/Life card/);
  });

  it('counter and DON!!: the board’s verdict, or the chosen line', async () => {
    const counter = ((await loadBank('counter', ai, cards)) as CounterItem[])[0]!;
    expect(
      answerFor(ai, { item: counter }, { kind: 'board', outcome: 'solved' }, cards, lists).correct,
    ).toBe(true);
    const bad = answerFor(
      ai,
      { item: counter },
      { kind: 'board', outcome: 'failed' },
      cards,
      lists,
    );
    expect(bad.correct).toBe(false);
    expect(bad.explanation).not.toBeNull();
    const don = ((await loadBank('don', ai, cards)) as DonItem[]).find((i) =>
      i.lines.some((l) => !i.best.includes(l.id)),
    )!;
    const best = answerFor(ai, { item: don }, { kind: 'line', lineId: don.best[0]! }, cards, lists);
    expect(best.correct).toBe(true);
    const worse = don.lines.find((l) => !don.best.includes(l.id))!;
    const w = answerFor(ai, { item: don }, { kind: 'line', lineId: worse.id }, cards, lists);
    expect(w.correct).toBe(false);
    expect(w.lines.at(-1)).toContain('A best line:');
  });

  it('an item from a game answers with its flag’s own words', async () => {
    const counter = ((await loadBank('counter', ai, cards)) as CounterItem[])[0]!;
    const explanation = ai.explainCounter(counter, cards)!;
    const v = answerFor(
      ai,
      { item: { ...counter, id: 'flag:g:f' }, explanation },
      { kind: 'board', outcome: 'failed' },
      cards,
      lists,
    );
    expect(v.explanation).toBe(explanation);
    expect(v.correct).toBe(false);
  });
});

describe('screens', () => {
  it('the mulligan item: Keep then Redraw, one class, nothing pre-focused, the hand read by the heading', async () => {
    const item = ((await loadBank('mulligan', ai, cards)) as MulliganItem[])[0]!;
    const html = renderToStaticMarkup(
      createElement(MulliganItemScreen, { ai, item, cards, onAnswer: () => undefined, ...common }),
    );
    const buttons = [
      ...html.matchAll(/<button type="button" class="([^"]*drill-answer[^"]*)">([^<]*)/g),
    ];
    expect(buttons.map((b) => b[2]!.trim())).toEqual(['Keep', 'Redraw']);
    expect(buttons[0]![1]).toBe(buttons[1]![1]);
    expect(html).not.toMatch(/autofocus/i);
    expect(html).toMatch(/<h1 id="page-title" tabindex="-1">/);
    expect(html).toContain('Item 3 of 10');
    expect(html).toMatch(/You go (first|second)\./);
    expect(html).not.toMatch(/btn primary/);
  });

  it('DON!! "Choose a line": a radio per line in listed order, none checked', async () => {
    const don = ((await loadBank('don', ai, cards)) as DonItem[])[0]!;
    const html = renderToStaticMarkup(
      createElement(ChooseLineScreen, {
        item: don,
        onSubmit: () => undefined,
        onBoard: () => undefined,
        ...common,
      }),
    );
    const radios = [...html.matchAll(/<input type="radio"[^>]*>/g)];
    expect(radios).toHaveLength(don.lines.length);
    for (const r of radios) expect(r[0]).not.toContain('checked');
    expect(html).toContain('disabled');
  });

  it('the answer says right or wrong in words and a shape; the summary says passed or not yet', () => {
    const mk = (title: string, correct: boolean) =>
      renderToStaticMarkup(
        createElement(AnswerScreen, {
          view: {
            correct,
            title,
            lines: ['x'],
            explanation: null,
            context: 'drill',
            spoken: '',
          },
          last: false,
          onNext: () => undefined,
        }),
      );
    expect(mk('Correct', true)).toContain('✓');
    expect(mk('Not this time', false)).toContain('✗');
    expect(mk('Answer shown', false)).toContain('◌');
    const sum = (right: number) =>
      renderToStaticMarkup(
        createElement(SummaryScreen, {
          drill: 'lethal',
          summary: summarise(
            'lethal',
            Array.from({ length: 10 }, (_, i) => ({
              itemId: `${i}`,
              correct: i < right,
              shownAnswer: false,
              ms: null,
            })),
            10,
            null,
          ),
          archetypeName: null,
          dropped: null,
          again: () => undefined,
        }),
      );
    expect(sum(8)).toContain('8 of 10: passed');
    expect(sum(7)).toContain('7 of 10: not yet');
  });
});

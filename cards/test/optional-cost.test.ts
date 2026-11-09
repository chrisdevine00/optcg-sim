/**
 * Each script's optional-cost flag matches its card text ("You may ..." before the colon, CR
 * 8-3-1-4), over every registered script, plus planted mismatches so the check itself can fail.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Ability } from '../src/dsl.ts';
import { optionalCostProblems } from '../src/optional-cost.ts';
import type { Card, SetFile } from '../src/schema.ts';
import { SCRIPTS } from '../effects/index.ts';

const byId = new Map<string, Card>();
for (const f of readdirSync(new URL('../data/sets/', import.meta.url))) {
  const set = JSON.parse(
    readFileSync(new URL(`../data/sets/${f}`, import.meta.url), 'utf8'),
  ) as SetFile;
  for (const c of set.cards) byId.set(c.id, c);
}

describe('optional-cost flags match the card text', () => {
  it.each(Object.values(SCRIPTS).map((s) => [s.cardId, s] as const))('%s', (id, s) => {
    expect(optionalCostProblems(s, byId.get(id)!)).toEqual([]);
  });

  it('actually judges something (every kind of ability is found)', () => {
    let judged = 0;
    for (const s of Object.values(SCRIPTS))
      for (const a of s.abilities)
        if (a.kind === 'auto' || a.kind === 'activate') if (a.cost?.length) judged++;
    expect(judged).toBeGreaterThan(20);
  });
});

describe('the check fails on planted mismatches', () => {
  const act = (extra: object, cost: object[] = [{ restDon: 2 }]): Ability =>
    ({ id: 'x', kind: 'activate', when: 'main', cost, effect: [], ...extra }) as unknown as Ability;
  const event = (effectText: string) => ({ category: 'Event', effectText, triggerText: null });

  it('an Event worded "you may" with no costOptional', () => {
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [act({})] },
      event('[Main] You may rest 2 of your DON!! cards: Draw 1 card.'),
    );
    expect(p).toHaveLength(1);
  });
  it('an Event with costOptional whose text is mandatory', () => {
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [act({ costOptional: true })] },
      event('[Main] Rest 2 of your DON!! cards: Draw 1 card.'),
    );
    expect(p).toHaveLength(1);
  });
  it('agreement passes', () => {
    expect(
      optionalCostProblems(
        { cardId: 'T-1', abilities: [act({ costOptional: true })] },
        event('[Main] You may rest 2 of your DON!! cards: Draw 1 card.'),
      ),
    ).toEqual([]);
  });
  it('an auto with a cost whose text is mandatory', () => {
    const ab = {
      id: 'x',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [],
    } as unknown as Ability;
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [ab] },
      {
        category: 'Character',
        effectText: '[On Play] Trash 1 card from your hand: Draw 1 card.',
        triggerText: null,
      },
    );
    expect(p).toHaveLength(1);
  });
  it('a "you may" cost clause with no script cost', () => {
    const ab = { id: 'x', kind: 'auto', when: ['onPlay'], effect: [] } as unknown as Ability;
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [ab] },
      {
        category: 'Character',
        effectText: '[On Play] You may trash 1 card from your hand: Draw 1 card.',
        triggerText: null,
      },
    );
    expect(p).toHaveLength(1);
  });
  it('costOptional on a Character [Activate: Main] changes legality, so it is rejected', () => {
    const ab = act({ when: 'activateMain', costOptional: true });
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [ab] },
      {
        category: 'Character',
        effectText: '[Activate: Main] You may rest 2 of your DON!! cards: Draw 1 card.',
        triggerText: null,
      },
    );
    expect(p).toHaveLength(1);
  });
  it('a replacement whose optional flag disagrees', () => {
    const ab = {
      id: 'x',
      kind: 'replacement',
      replaces: { ko: { from: 'self', owner: 'you' } },
      optional: false,
      instead: [{ returnDon: 1 }],
    } as unknown as Ability;
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [ab] },
      {
        category: 'Character',
        effectText: "If this Character would be K.O.'d, you may return 1 DON!! card instead.",
        triggerText: null,
      },
    );
    expect(p).toHaveLength(1);
  });
});

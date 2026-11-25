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
  const cost1 = [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }];
  const auto = (extra: object): Ability =>
    ({ id: 'x', kind: 'auto', when: ['onPlay'], effect: [], ...extra }) as unknown as Ability;
  const chr = (effectText: string) => ({ category: 'Character', effectText, triggerText: null });
  it('an auto with a colon cost and no "you may" is accepted (W57-R1: the cost may be declined)', () => {
    expect(
      optionalCostProblems(
        { cardId: 'T-1', abilities: [auto({ cost: cost1 })] },
        chr('[On Play] Trash 1 card from your hand: Draw 1 card.'),
      ),
    ).toEqual([]);
  });
  it('an auto whose text has a colon cost with no "you may" but whose script has no cost is refused', () => {
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [auto({})] },
      chr('[On Play] Trash 1 card from your hand: Draw 1 card.'),
    );
    expect(p).toHaveLength(1);
  });
  it('"choose one:" is not a cost', () => {
    expect(
      optionalCostProblems(
        { cardId: 'T-1', abilities: [auto({})] },
        chr('[On Play] Choose one: • Draw 1 card. • Trash 1 card.'),
      ),
    ).toEqual([]);
  });
  it('an auto with a script cost and no cost clause in the text is refused', () => {
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [auto({ cost: cost1 })] },
      chr('[On Play] Draw 1 card.'),
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

describe('the start-of-turn printed window ("This effect can be activated at the start of your turn")', () => {
  const start = {
    id: 'x',
    kind: 'auto',
    when: ['startOfYourTurn'],
    cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    effect: [],
  } as unknown as Ability;
  const card = (effectText: string) => ({ category: 'Leader', effectText, triggerText: null });
  const problems = (effectText: string) =>
    optionalCostProblems({ cardId: 'T-1', abilities: [start] }, card(effectText));

  it('matches the untagged unit (the OP11-040 form), with and without [Once Per Turn]', () => {
    const text =
      'This effect can be activated at the start of your turn. You may trash 1 card from your hand: Draw 1 card.';
    expect(problems(text)).toEqual([]);
    expect(problems(`[Once Per Turn] ${text}`)).toEqual([]);
  });

  it('judges the cost clause of that unit: a cost with no "you may" is now accepted (W57-R1), and found', () => {
    expect(
      problems(
        'This effect can be activated at the start of your turn. Trash 1 card from your hand: Draw 1 card.',
      ),
    ).toEqual([]);
    // A script with no cost against the same text proves the unit was found and judged.
    const none = { ...start, cost: undefined } as unknown as Ability;
    const p = optionalCostProblems(
      { cardId: 'T-1', abilities: [none] },
      card(
        'This effect can be activated at the start of your turn. Trash 1 card from your hand: Draw 1 card.',
      ),
    );
    expect(p.filter((x) => x.includes('cost clause'))).toHaveLength(1);
  });

  it('W57-R5: "This effect can be activated ..." with no cost needs optional: true (or a may step)', () => {
    const text =
      '[Once Per Turn] This effect can be activated when your opponent attacks. Draw 1 card.';
    const mk = (extra: object, effect: object[] = []) =>
      ({
        id: 'x',
        kind: 'auto',
        when: ['onOpponentAttack'],
        oncePerTurn: true,
        effect,
        ...extra,
      }) as unknown as Ability;
    const run = (ab: Ability) =>
      optionalCostProblems(
        { cardId: 'T-1', abilities: [ab] },
        { category: 'Leader', effectText: text, triggerText: null },
      );
    expect(run(mk({}))).toHaveLength(1);
    expect(run(mk({ optional: true }))).toEqual([]);
    expect(run(mk({}, [{ may: [], label: 'x' }]))).toEqual([]);
  });

  it('does not match a unit that opens with another tag', () => {
    const p = problems(
      '[On Play] This effect can be activated at the start of your turn. You may trash 1 card from your hand: Draw 1 card.',
    );
    expect(p).toEqual(['T-1.x: no text unit found for this ability']);
  });

  it('does not match an unrelated unit', () => {
    const p = problems('[On Play] You may trash 1 card from your hand: Draw 1 card.');
    expect(p).toEqual(['T-1.x: no text unit found for this ability']);
  });
});

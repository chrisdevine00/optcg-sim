import type { CardScript } from '../../src/dsl.ts';

/** OP12-066 Carne. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_066: CardScript = {
  cardId: 'OP12-066',
  textHash: '1169a0857a0f8e',
  verified: {
    source: 'cards/overrides/OP12-066.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With 4 or more Events in your trash, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } },
            '>=',
            4,
          ],
        },
      ],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } }],
    },
  ],
  rulings: [
    'Reading: the parenthesis is the [Blocker] reminder text; [Blocker] is gained, not printed, so keywords stays empty',
  ],
};

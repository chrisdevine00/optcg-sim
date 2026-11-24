import type { CardScript } from '../../src/dsl.ts';

/** OP16-033 Morley. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_033: CardScript = {
  cardId: 'OP16-033',
  textHash: '0a58876155cab3',
  verified: {
    source: 'cards/overrides/OP16-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Unblockable'],
  abilities: [
    {
      id: 'rest-shield',
      label: "Rest 2 of your cards instead of being K.O.'d",
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      },
      optional: true,
      instead: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
    },
  ],
};

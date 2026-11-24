import type { CardScript } from '../../src/dsl.ts';

/** OP11-057 Pedro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_057: CardScript = {
  cardId: 'OP11-057',
  textHash: '1b37e3bc7f18c2',
  verified: {
    source: 'cards/overrides/OP11-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With 4 or less cards in your hand, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              hand: 'you',
            },
            '<=',
            4,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
  ],
};

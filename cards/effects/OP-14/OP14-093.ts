import type { CardScript } from '../../src/dsl.ts';

/** OP14-093 Mr.4(Babe). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_093: CardScript = {
  cardId: 'OP14-093',
  textHash: '0c84d55ff1b98d',
  verified: {
    source: 'cards/overrides/OP14-093.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        'Add up to 1 Baroque Works Character with a cost of 8 or less from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { typeIncludes: 'Baroque Works' },
                    { cost: { lte: 8 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
};

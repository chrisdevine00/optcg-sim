import type { CardScript } from '../../src/dsl.ts';

/** OP10-090 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_090: CardScript = {
  cardId: 'OP10-090',
  textHash: '088439f19cd450',
  verified: {
    source: 'cards/overrides/OP10-090.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label: 'Play up to 1 Dressrosa Character with a cost of 3 or less from your trash rested',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Dressrosa',
                    },
                    {
                      cost: {
                        lte: 3,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};

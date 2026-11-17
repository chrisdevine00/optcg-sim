import type { CardScript } from '../../src/dsl.ts';

/** EB04-058 Borsalino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_058: CardScript = {
  cardId: 'EB04-058',
  textHash: '1dc86337b3f8ef',
  verified: {
    source: 'cards/overrides/EB04-058.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'With 2 or less Life, add up to 1 card from your deck to your Life',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'deckTop',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'life',
                    position: 'top',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP15-113 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_113: CardScript = {
  cardId: 'OP15-113',
  textHash: '1c0ff62065757b',
  verified: {
    source: 'cards/overrides/OP15-113.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Trash 1 card from your hand: add up to 1 card from the top of your deck to the top of your Life',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
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
};

import type { CardScript } from '../../src/dsl.ts';

/** ST22-003 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_003: CardScript = {
  cardId: 'ST22-003',
  textHash: '169a12ebf7d672',
  verified: {
    source: 'cards/overrides/ST22-003.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Double Attack'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal 1 card from the top of your deck; if its type includes "Whitebeard Pirates", draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            reveal: {
              from: 'deckTop',
              n: 1,
              bind: 'revealed',
            },
          },
        },
        {
          if: {
            ref: 'revealed',
            matches: {
              typeIncludes: 'Whitebeard Pirates',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['RL-44: the revealed card stays on top on a miss and is the first card drawn on a hit'],
};

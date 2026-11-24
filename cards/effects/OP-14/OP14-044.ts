import type { CardScript } from '../../src/dsl.ts';

/** OP14-044 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_044: CardScript = {
  cardId: 'OP14-044',
  textHash: '0e7f6c1d89d252',
  verified: {
    source: 'cards/overrides/OP14-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal 1 from the top of your deck; if its type includes "Whitebeard Pirates", draw 2 and trash 1 from your hand',
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
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['RL-44: a hit draws the revealed card; a miss leaves it on top'],
};

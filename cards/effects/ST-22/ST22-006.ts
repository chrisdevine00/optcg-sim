import type { CardScript } from '../../src/dsl.ts';

/** ST22-006 Jozu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_006: CardScript = {
  cardId: 'ST22-006',
  textHash: '05eff6a106e438',
  verified: {
    source: 'cards/overrides/ST22-006.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal 1 card from the top of your deck; if its type includes "Whitebeard Pirates", draw 2 cards and trash 1 card from your hand',
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
  rulings: [
    'reading: the trash is part of the hit ("draw 2 cards and trash 1"), mandatory after the draw',
  ],
};

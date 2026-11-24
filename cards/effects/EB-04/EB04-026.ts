import type { CardScript } from '../../src/dsl.ts';

/** EB04-026 Bluegrass. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_026: CardScript = {
  cardId: 'EB04-026',
  textHash: '03f17d93cfcf78',
  verified: {
    source: 'cards/overrides/EB04-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Place up to 1 of your opponent's Characters with a cost of 1 or less at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 1,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label: 'Draw 1 card and trash 1 card from your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            draw: 1,
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
  rulings: [
    'reading: the Character goes to the bottom of its OWNER\'s deck; "cost of 1 or less" is the current cost (a cost-0 Character qualifies)',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** ST22-017 Fire Fist. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST22_017: CardScript = {
  cardId: 'ST22-017',
  textHash: '14c8129427e6f8',
  verified: {
    source: 'cards/overrides/ST22-017.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may reveal 2 {Whitebeard Pirates} cards from your hand: draw 1 card; then place up to 1 Character with a cost of 5 or less at the bottom of its owner's deck",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'Whitebeard Pirates',
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 5,
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
      id: 'trigger',
      label: "Return up to 1 Character with a cost of 3 or less to its owner's hand",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 3,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Character" names no owner, so either side, current cost (the Character is chosen after the draw)',
  ],
};

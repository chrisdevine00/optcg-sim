import type { CardScript } from '../../src/dsl.ts';

/** OP18-058 This Kingdom is Doomed. You Can't Save It!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_058: CardScript = {
  cardId: 'OP18-058',
  textHash: '0992aa63651ea3',
  verified: {
    source: 'cards/overrides/OP18-058.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may return 1 of your Characters to the owner's hand: place up to 1 Character with a cost of 4 or less at the bottom of the owner's deck",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 4,
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
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Character returned as the cost is in the hand when the placement resolves, so it cannot be the target; "Character" with no owner qualifier is any Character on the field, yours included; the cost is optional and declining places nothing',
  ],
};

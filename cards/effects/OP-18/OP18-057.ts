import type { CardScript } from '../../src/dsl.ts';

/** OP18-057 Atomic Dicer. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_057: CardScript = {
  cardId: 'OP18-057',
  textHash: '1fd77d346576a6',
  verified: {
    source: 'cards/overrides/OP18-057.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 3 of your DON!! cards: return up to 1 Character with a cost of 5 or less to the owner's hand",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 3,
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
                    lte: 5,
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
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Character" with no owner qualifier is any Character on the field, yours included; the DON!! cost is optional and declining it returns nothing (the Event is still played)',
  ],
};

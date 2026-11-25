import type { CardScript } from '../../src/dsl.ts';

/** OP10-002 Caesar Clown. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_002: CardScript = {
  cardId: 'OP10-002',
  textHash: '05ad05869232f1',
  verified: {
    source: 'cards/overrides/OP10-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "[DON!! x2] You may return a {Punk Hazard} Character with a cost of 2 or more to your hand: K.O. up to 1 of your opponent's Characters with 4000 power or less",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 2,
        },
      ],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  type: 'Punk Hazard',
                },
                {
                  cost: {
                    gte: 2,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 4000,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the returned Character is a cost of 2 or more by its current cost; the K.O. target is chosen after the cost and its power limit is its current power',
  ],
};

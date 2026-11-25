import type { CardScript } from '../../src/dsl.ts';

/** OP10-018 Ten-Layer Igloo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_018: CardScript = {
  cardId: 'OP10-018',
  textHash: '1154d3ae4b58d7',
  verified: {
    source: 'cards/overrides/OP10-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        "Up to 1 of your Leader or Character cards gains +3000 power during this battle; then give up to 1 of your opponent's Leader or Character cards -2000 power during this turn",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Up to 1 of your Leader or Character cards gains +1000 power during this turn',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is sequential, not "If you do": the -2000 happens even when nobody was buffed; it lasts the whole turn, the +3000 only the battle',
  ],
};

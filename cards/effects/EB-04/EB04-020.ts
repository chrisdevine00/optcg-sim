import type { CardScript } from '../../src/dsl.ts';

/** EB04-020 Shark Brick Fist. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_020: CardScript = {
  cardId: 'EB04-020',
  textHash: '008ce0d5f28579',
  verified: {
    source: 'cards/overrides/EB04-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your {Fish-Man} Leader or Character cards gains +3000 power during this battle; then set up to 1 of your {Fish-Man} Characters as active',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  type: 'Fish-Man',
                },
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
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                type: 'Fish-Man',
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
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
    'reading: "Then" is independent of the power step (no "If you do"); the set-active may pick a different Character from the power target (a Leader is not a Character, so a {Fish-Man} Leader cannot be set active)',
  ],
};

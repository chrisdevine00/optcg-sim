import type { CardScript } from '../../src/dsl.ts';

/** EB02-007 Cloven Rose Blizzard. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_007: CardScript = {
  cardId: 'EB02-007',
  textHash: '18e55e27955bc7',
  verified: {
    source: 'cards/overrides/EB02-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Up to a total of 3 of your Leader and Character cards gain +1000 power this turn; then K.O. up to 1 of your opponent's Characters with 3000 power or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 3,
                },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 3000,
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
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with 4000 power or less",
      kind: 'trigger',
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
    'Read: "up to a total of 3" is one pick of up to 3 across the Leader and Characters (a Character at most once); "Then" is sequential, so the K.O. does not depend on a card having been boosted',
    'Read: "3000 power or less" is the target\'s current power when the K.O. resolves (DON!! given and buffs count); the +1000 goes to your own cards only',
  ],
};

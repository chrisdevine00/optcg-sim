import type { CardScript } from '../../src/dsl.ts';

/** OP11-018 Honesty Impact. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_018: CardScript = {
  cardId: 'OP11-018',
  textHash: '0953efe7bf2281',
  verified: {
    source: 'cards/overrides/OP11-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Give up to 1 of your opponent's Characters -4000 power this turn, then K.O. up to 1 of their Characters with 6000 power or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -4000,
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
                  lte: 6000,
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
      label: "K.O. up to 1 of your opponent's Characters with 6000 power or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
                  lte: 6000,
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
    'reading: "Then" is sequential (not "If you do"); the K.O. reads current power, so the Character just lowered by 4000 qualifies up to 10000 base',
  ],
};

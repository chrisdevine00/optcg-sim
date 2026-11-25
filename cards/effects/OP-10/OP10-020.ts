import type { CardScript } from '../../src/dsl.ts';

/** OP10-020 Gum-Gum UFO. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_020: CardScript = {
  cardId: 'OP10-020',
  textHash: '0fee98b8b02d3f',
  verified: {
    source: 'cards/overrides/OP10-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Give up to 1 of your opponent's Characters -4000 power during this turn; then, if you have 2 or less Life cards, up to 1 of your Leader or Character cards gains +1000 power during this turn",
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
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              2,
            ],
          },
          then: [
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
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with 3000 power or less",
      kind: 'trigger',
      effect: [
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
  ],
  rulings: [
    'reading: the Life condition is checked as the effect resolves, whether or not the -4000 target was chosen',
  ],
};

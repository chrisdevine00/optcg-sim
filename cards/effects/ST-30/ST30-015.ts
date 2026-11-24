import type { CardScript } from '../../src/dsl.ts';

/** ST30-015 The Name of This Era Is "Whitebeard"!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST30_015: CardScript = {
  cardId: 'ST30-015',
  textHash: '12d40d72a50e98',
  verified: {
    source: 'cards/overrides/ST30-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'If you have 2 or more Characters with 6000 base power, up to 1 of your Leader or Character cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    basePower: {
                      eq: 6000,
                    },
                  },
                },
              },
              '>=',
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
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
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
    'reading: the [Counter] condition is checked as the effect resolves (EB05-008 precedent): with fewer than 2 the Counter is played and does nothing; the [Trigger] reads current power',
  ],
};

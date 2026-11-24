import type { CardScript } from '../../src/dsl.ts';

/** EB04-009 It's My Student's Farewell. I Want It to Be Proper.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_009: CardScript = {
  cardId: 'EB04-009',
  textHash: '1b86698537abbd',
  verified: {
    source: 'cards/overrides/EB04-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may give 1 active DON!! to your [Silvers Rayleigh]: give up to 1 of your opponent's Characters -2000 power",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          giveDon: {
            n: 1,
            state: 'active',
            to: {
              from: ['leader', 'characters'],
              owner: 'you',
              filter: {
                name: 'Silvers Rayleigh',
              },
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
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
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'Up to 1 of your Characters or [Silvers Rayleigh] gains +2000 power during this battle',
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
                  any: [
                    {
                      category: ['Character'],
                    },
                    {
                      name: 'Silvers Rayleigh',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [Silvers Rayleigh] may be the Leader or a Character; the cost needs an active DON!! and a Rayleigh on the field (the engine checks both); the given DON!! stays on the Rayleigh (+1000 on your turn)',
    'reading: [Counter] "Characters or [Silvers Rayleigh]": any of your Characters, or a Rayleigh Leader; any other Leader is not a target',
  ],
};

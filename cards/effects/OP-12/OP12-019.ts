import type { CardScript } from '../../src/dsl.ts';

/** OP12-019 Color of Arms Haki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_019: CardScript = {
  cardId: 'OP12-019',
  textHash: '1ab85eca973e51',
  verified: {
    source: 'cards/overrides/OP12-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may give 1 active DON!! to your [Silvers Rayleigh]: up to 1 of your Leader or Character cards gains +1000 power',
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
    'Read: [Counter] "Characters or [Silvers Rayleigh]": any of your Characters, or a Rayleigh Leader; any other Leader is not a target (the [Main] allows any Leader or Character)',
  ],
};

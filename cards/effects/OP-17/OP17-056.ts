import type { CardScript } from '../../src/dsl.ts';

/** OP17-056 Rocks Pirates. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_056: CardScript = {
  cardId: 'OP17-056',
  textHash: '16450db91dca89',
  verified: {
    source: 'cards/overrides/OP17-056.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      costOptional: true,
      label: "Return up to 1 Character with a cost of 6 or less to its owner's hand",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          restDon: 5,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 6,
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
      label: 'Up to 1 of your "Rocks Pirates" Leader or Characters gains +2000 power',
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
                  typeIncludes: 'Rocks Pirates',
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
};

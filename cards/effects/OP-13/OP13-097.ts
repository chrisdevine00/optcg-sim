import type { CardScript } from '../../src/dsl.ts';

/** OP13-097 The World's Equilibrium Cannot Be Maintained Forever. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_097: CardScript = {
  cardId: 'OP13-097',
  textHash: '18d94cc10b549e',
  verified: {
    source: 'cards/overrides/OP13-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Rest 5 DON!!: if you only have {Celestial Dragons} Characters, K.O. up to 1 of opponent's Characters with base cost 6 or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 5,
        },
      ],
      effect: [
        {
          if: {
            all: [
              {
                exists: {
                  from: 'characters',
                  owner: 'you',
                },
              },
              {
                none: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    not: {
                      type: 'Celestial Dragons',
                    },
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 6,
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
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** EB02-002 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_002: CardScript = {
  cardId: 'EB02-002',
  textHash: '07e728360cb08c',
  verified: {
    source: 'cards/overrides/EB02-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power',
      label: 'Rest this Character: up to 1 other {Revolutionary Army} Character gains +2000 power',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  all: [
                    {
                      type: 'Revolutionary Army',
                    },
                    {
                      not: {
                        name: 'Sabo',
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: "other than [Sabo]" excludes every Character named Sabo, not only this card'],
};

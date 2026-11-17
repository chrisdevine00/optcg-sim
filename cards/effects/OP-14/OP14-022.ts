import type { CardScript } from '../../src/dsl.ts';

/** OP14-022 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_022: CardScript = {
  cardId: 'OP14-022',
  textHash: '0d889ea092dc1d',
  verified: {
    source: 'cards/overrides/OP14-022.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'end-turn',
      label: 'With a FILM or Straw Hat Crew Leader, set up to 2 DON!! active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      conditions: [
        {
          leader: {
            any: [
              {
                type: 'FILM',
              },
              {
                type: 'Straw Hat Crew',
              },
            ],
          },
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
  ],
};

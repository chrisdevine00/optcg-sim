import type { CardScript } from '../../src/dsl.ts';

/** OP13-027 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_027: CardScript = {
  cardId: 'OP13-027',
  textHash: '026eb3f5054bf0',
  verified: {
    source: 'cards/overrides/OP13-027.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Set up to 2 DON!! active',
      kind: 'auto',
      when: ['onPlay'],
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
    {
      id: 'end-turn',
      label: 'With a FILM or Straw Hat Crew Leader, set up to 1 DON!! active',
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
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    '"Straw Hat Crew" and {Straw Hat Crew} are the same type test (typeIncludes is not needed: exact type element)',
  ],
};

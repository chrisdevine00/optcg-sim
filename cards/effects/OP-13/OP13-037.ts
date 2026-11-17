import type { CardScript } from '../../src/dsl.ts';

/** OP13-037 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_037: CardScript = {
  cardId: 'OP13-037',
  textHash: '09cc6a7ffe4f73',
  verified: {
    source: 'cards/overrides/OP13-037.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader is FILM or Straw Hat Crew, set up to 2 DON!! as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
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
          then: [
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
    },
    {
      id: 'end-of-turn',
      label: 'Set this Character as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: 'self',
              owner: 'you',
            },
          },
        },
      ],
    },
  ],
};

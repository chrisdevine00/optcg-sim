import type { CardScript } from '../../src/dsl.ts';

/** OP14-039 Coffin Boat. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_039: CardScript = {
  cardId: 'OP14-039',
  textHash: '146a890f373763',
  verified: {
    source: 'cards/overrides/OP14-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader is [Dracule Mihawk], draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              name: 'Dracule Mihawk',
            },
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'end',
      label: 'If your Leader is [Dracule Mihawk], set up to 1 of your DON!! cards as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            leader: {
              name: 'Dracule Mihawk',
            },
          },
          then: [
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
    },
  ],
};

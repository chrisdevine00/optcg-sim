import type { CardScript } from '../../src/dsl.ts';

/** OP15-081 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_081: CardScript = {
  cardId: 'OP15-081',
  textHash: '0d2d1626e5bdb2',
  verified: {
    source: 'cards/overrides/OP15-081.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Straw Hat Crew} type, trash 5 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Straw Hat Crew',
            },
          },
          then: [
            {
              do: {
                mill: {
                  player: 'you',
                  n: 5,
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

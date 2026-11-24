import type { CardScript } from '../../src/dsl.ts';

/** EB05-037 Black Maria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_037: CardScript = {
  cardId: 'EB05-037',
  textHash: '115c8a068850b9',
  verified: {
    source: 'cards/overrides/EB05-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 3; add up to 1 {Animal Kingdom Pirates} card to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Animal Kingdom Pirates',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};

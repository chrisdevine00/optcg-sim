import type { CardScript } from '../../src/dsl.ts';

/** EB04-037 Porche. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_037: CardScript = {
  cardId: 'EB04-037',
  textHash: '06a02bbf074450',
  verified: {
    source: 'cards/overrides/EB04-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With a {Foxy Pirates} Leader, look at 5; add up to 1 {Foxy Pirates} card to your hand, the rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Foxy Pirates',
            },
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 5,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
                      filter: {
                        type: 'Foxy Pirates',
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
    },
  ],
};

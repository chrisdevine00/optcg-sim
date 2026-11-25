import type { CardScript } from '../../src/dsl.ts';

/** EB02-013 Carrot. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_013: CardScript = {
  cardId: 'EB02-013',
  textHash: '0f593bf2dddc86',
  verified: {
    source: 'cards/overrides/EB02-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With 3 or more DON!!: look at 7, add up to 1 [Zou]; rest to the bottom; play up to 1 [Zou] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '>=',
              3,
            ],
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 7,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
                      filter: {
                        name: 'Zou',
                      },
                      reveal: true,
                      to: 'hand',
                    },
                  ],
                  rest: 'bottomAnyOrder',
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      name: 'Zou',
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: both the search and the "Then ... play" are inside the DON!! guard; DON!! on the field counts the cost area and given DON!!; [Zou] is a Stage; the play is a free play of a hand card (a replaced Stage goes to the trash)',
    'reading: the play pick is asked on the hand whatever the hand holds (no prompt depends on a hidden card)',
  ],
};

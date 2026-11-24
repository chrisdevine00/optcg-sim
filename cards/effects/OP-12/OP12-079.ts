import type { CardScript } from '../../src/dsl.ts';

/** OP12-079 Luffy Is the Man Who Will Be King of the Pirates!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_079: CardScript = {
  cardId: 'OP12-079',
  textHash: '10c25e777e3bf1',
  verified: {
    source: 'cards/overrides/OP12-079.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'With a [Sanji] Leader: look at 3, add up to 1 to your hand, rest to the bottom',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              name: 'Sanji',
            },
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 3,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
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
  rulings: [
    'reading: the Leader is [Sanji] = the exact Leader name; the card is not revealed ("add up to 1 card")',
  ],
};

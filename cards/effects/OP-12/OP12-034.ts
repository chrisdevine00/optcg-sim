import type { CardScript } from '../../src/dsl.ts';

/** OP12-034 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_034: CardScript = {
  cardId: 'OP12-034',
  textHash: '049b2bbbcf612b',
  verified: {
    source: 'cards/overrides/OP12-034.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the <Slash> attribute, look at 5 cards from the top of your deck; reveal up to 1 <Slash> attribute card or green Event and add it to your hand, then place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { attribute: 'Slash' } },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 5,
                  take: [
                    {
                      pick: { upTo: 1 },
                      filter: {
                        any: [
                          { attribute: 'Slash' },
                          { all: [{ category: ['Event'] }, { color: 'Green' }] },
                        ],
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
  rulings: [
    'reading: the "If" has no colon, so it is an effect condition: with a Leader without <Slash> the ability fires and nothing is looked at; the attribute is the Leader\'s printed one',
    'reading: "<Slash> attribute card" is any category with that printed attribute; "green Event" is an Event whose color is green; the search may take nothing; the rest go to the bottom in an order the owner chooses',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP12-028 Kouzuki Hiyori. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_028: CardScript = {
  cardId: 'OP12-028',
  textHash: '1f37483d0e4622',
  verified: {
    source: 'cards/overrides/OP12-028.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'look',
      label:
        'You may rest 1 of your DON!! cards and this Character: if your Leader is [Roronoa Zoro], look at 5 cards from the top of your deck; reveal up to 1 <Slash> attribute card or green Event and add it to your hand, then place the rest at the bottom in any order',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restDon: 1 }, { restSelf: true }],
      effect: [
        {
          if: { leader: { name: 'Roronoa Zoro' } },
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
    'reading: the "If your Leader is [Roronoa Zoro]" comes after the cost colon, so it is an effect condition: with another Leader the DON!! and the Character are rested and nothing else happens (DECISIONS 2026-11-24, B3A-R1); [Roronoa Zoro] is the Leader\'s exact name',
    'reading: "<Slash> attribute card" is any category with that printed attribute; "green Event" is an Event whose color is green (a multicolor card with green counts); the search may take nothing; the rest go to the bottom in an order the owner chooses',
  ],
};

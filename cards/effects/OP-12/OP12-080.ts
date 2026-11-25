import type { CardScript } from '../../src/dsl.ts';

/** OP12-080 Baratie. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_080: CardScript = {
  cardId: 'OP12-080',
  textHash: '0f0922424ae2b6',
  verified: {
    source: 'cards/overrides/OP12-080.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'place-look',
      label:
        "You may place this Stage at the bottom of the owner's deck: if your Leader is [Sanji], look at 3 cards from the top of your deck; reveal up to 1 Event and add it to your hand, then place the rest at the bottom of your deck in any order",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          move: { from: 'self', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'deck', position: 'bottom' },
        },
      ],
      effect: [
        {
          if: { leader: { name: 'Sanji' } },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 3,
                  take: [
                    {
                      pick: { upTo: 1 },
                      filter: { category: ['Event'] },
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
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
  rulings: [
    "reading (G52): the Stage pays with itself as a removal with the cause cost; it goes to the bottom of its owner's deck, which is yours",
    'reading: the "If your Leader is [Sanji]" comes after the cost colon, so it is an effect condition: with another Leader the cost is paid (the Stage is placed) and nothing else happens (DECISIONS 2026-11-24, B3A-R1)',
    "reading: [Sanji] is the Leader's exact name; the search may take nothing (CR 8-4-4-2); the rest go to the bottom in an order the owner chooses",
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP09-057 Cross Guild. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_057: CardScript = {
  cardId: 'OP09-057',
  textHash: '0efd03f43fd82e',
  verified: {
    source: 'cards/overrides/OP09-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        '[Main] Look at 4; reveal up to 1 Cross Guild card and add it to your hand; rest to the bottom',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Cross Guild',
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
    {
      id: 'trigger',
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: "\\"Cross Guild\\" type card" is any category with that type element'],
};

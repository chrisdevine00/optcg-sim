import type { CardScript } from '../../src/dsl.ts';

/** EB04-049 Finger Pistol Yellow Lotus. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_049: CardScript = {
  cardId: 'EB04-049',
  textHash: '14853dc289d23d',
  verified: {
    source: 'cards/overrides/EB04-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Trash 2 cards from the top of your deck: K.O. up to 1 opposing Character with a base cost of 5 or less',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          mill: 2,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                baseCost: {
                  lte: 5,
                },
              },
              pick: {
                upTo: 1,
              },
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
};

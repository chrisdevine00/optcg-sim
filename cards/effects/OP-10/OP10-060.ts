import type { CardScript } from '../../src/dsl.ts';

/** OP10-060 Barrier-Barrier Pistol. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_060: CardScript = {
  cardId: 'OP10-060',
  textHash: '0ac849f26caa06',
  verified: {
    source: 'cards/overrides/OP10-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Place up to 1 of your opponent's Characters with 6000 power or less at the bottom of the owner's deck",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  power: {
                    lte: 6000,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
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

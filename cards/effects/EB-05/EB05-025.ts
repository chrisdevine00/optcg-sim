import type { CardScript } from '../../src/dsl.ts';

/** EB05-025 Domino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_025: CardScript = {
  cardId: 'EB05-025',
  textHash: '029fe92d846320',
  verified: {
    source: 'cards/overrides/EB05-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 3; add up to 1 {Impel Down} card to your hand',
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
                    type: 'Impel Down',
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
      label: "Activate this card's [On Play] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'onPlay',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};

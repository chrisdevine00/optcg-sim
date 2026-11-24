import type { CardScript } from '../../src/dsl.ts';

/** OP15-079 Absalom. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_079: CardScript = {
  cardId: 'OP15-079',
  textHash: '1ba117425682de',
  verified: {
    source: 'cards/overrides/OP15-079.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Add up to 1 {Thriller Bark Pirates} card from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  type: 'Thriller Bark Pirates',
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [On K.O.] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'onKO',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};

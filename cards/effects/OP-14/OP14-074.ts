import type { CardScript } from '../../src/dsl.ts';

/** OP14-074 Monet. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_074: CardScript = {
  cardId: 'OP14-074',
  textHash: '16d45b23f7716e',
  verified: {
    source: 'cards/overrides/OP14-074.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader has {Donquixote Pirates}, add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Donquixote Pirates',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Draw 2 cards and trash 1 card from your hand; add up to 2 DON!! rested',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
        {
          do: {
            addDon: [
              {
                n: 2,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the draw and trash are mandatory; "Then" before the DON!! is sequential (the add happens even with an empty hand)',
  ],
};

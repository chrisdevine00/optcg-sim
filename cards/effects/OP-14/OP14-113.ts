import type { CardScript } from '../../src/dsl.ts';

/** OP14-113 Marguerite. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_113: CardScript = {
  cardId: 'OP14-113',
  textHash: '04f681e4235ce2',
  verified: {
    source: 'cards/overrides/OP14-113.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5, reveal up to 1 {Amazon Lily} or {Kuja Pirates} card to hand, place the rest at the bottom in any order, then trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { any: [{ type: 'Amazon Lily' }, { type: 'Kuja Pirates' }] },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader has the {Kuja Pirates} type, play this card',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { type: 'Kuja Pirates' } },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP17-109 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_109: CardScript = {
  cardId: 'OP17-109',
  textHash: '17e904b424a527',
  verified: {
    source: 'cards/overrides/OP17-109.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 card with a [Trigger]: draw 3 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              hasTrigger: true,
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 3,
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Look at 5; reveal up to 1 {Big Mom Pirates} card and add it to your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Big Mom Pirates',
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
};

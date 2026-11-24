import type { CardScript } from '../../src/dsl.ts';

/** EB05-029 Kimono Sleeve Cage. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_029: CardScript = {
  cardId: 'EB05-029',
  textHash: '1207bdf8d0a7ab',
  verified: {
    source: 'cards/overrides/EB05-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'May trash 1 card: negate up to 1 opposing Character cost 6 or less this turn and return it to hand',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            select: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 6,
                },
              },
              pick: {
                upTo: 1,
              },
              bind: 'target',
            },
          },
        },
        {
          do: {
            negate: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  ref: 'target',
                },
              },
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  ref: 'target',
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
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
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
      ],
    },
  ],
};

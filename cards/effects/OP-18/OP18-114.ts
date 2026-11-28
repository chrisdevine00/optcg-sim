import type { CardScript } from '../../src/dsl.ts';

/** OP18-114 Wanze. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_114: CardScript = {
  cardId: 'OP18-114',
  textHash: '1e2ee02c852604',
  verified: {
    source: 'cards/overrides/OP18-114.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'on-play',
      label: 'Look at all of your Life cards and place them back in your Life area in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { lookAtLife: { owner: 'you', n: 'all', place: 'anyOrder' } } }],
    },
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", place up to 1 Character with a cost of 5 or less at the bottom of the owner\'s deck',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: { cost: { lte: 5 } },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'deck', position: 'bottom' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (G64, M6b-Q81, as OP13-105): the cards never leave the Life area, keep the face state they had, and only you see them; with no Life cards nothing happens',
  ],
};

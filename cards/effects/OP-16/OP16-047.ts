import type { CardScript } from '../../src/dsl.ts';

/** OP16-047 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_047: CardScript = {
  cardId: 'OP16-047',
  textHash: '1e41edde7cf2ea',
  verified: {
    source: 'cards/overrides/OP16-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'You may rest this Character: if your opponent has 8 or more cards in hand, they place 2 cards from their hand at the bottom of their deck',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              8,
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'hand',
                    owner: 'opponent',
                    chooser: 'opponent',
                    pick: {
                      exactly: 2,
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
      ],
    },
  ],
};

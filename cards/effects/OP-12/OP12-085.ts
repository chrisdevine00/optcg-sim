import type { CardScript } from '../../src/dsl.ts';

/** OP12-085 Karasu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_085: CardScript = {
  cardId: 'OP12-085',
  textHash: '0c6358f78db9fc',
  verified: {
    source: 'cards/overrides/OP12-085.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-bonus',
      label: 'With a Revolutionary Army Leader, this Character gains +3 cost',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Revolutionary Army',
          },
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3,
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        'With a Revolutionary Army Leader and an opponent with 5+ cards in hand: your opponent trashes 1 card from their hand',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Revolutionary Army',
                },
              },
              {
                cmp: [
                  {
                    hand: 'opponent',
                  },
                  '>=',
                  5,
                ],
              },
            ],
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: {
                    exactly: 1,
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

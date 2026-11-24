import type { CardScript } from '../../src/dsl.ts';

/** EB05-028 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_028: CardScript = {
  cardId: 'EB05-028',
  textHash: '1d35f902364787',
  verified: {
    source: 'cards/overrides/EB05-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your opponent has 9 or more cards in hand, they trash 4',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              9,
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
                    exactly: 4,
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

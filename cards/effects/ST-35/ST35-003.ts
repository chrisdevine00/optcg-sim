import type { CardScript } from '../../src/dsl.ts';

/** ST35-003 Karasu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST35_003: CardScript = {
  cardId: 'ST35-003',
  textHash: '001e9569289951',
  verified: {
    source: 'cards/overrides/ST35-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'You may trash 2 cards from the top of your deck: if your opponent has 7 or more cards in hand, they trash 1',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [{ mill: 2 }],
      effect: [
        {
          if: { cmp: [{ hand: 'opponent' }, '>=', 7] },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: { exactly: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

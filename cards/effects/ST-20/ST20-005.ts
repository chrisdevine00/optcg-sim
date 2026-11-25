import type { CardScript } from '../../src/dsl.ts';

/** ST20-005 Charlotte Linlin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST20_005: CardScript = {
  cardId: 'ST20-005',
  textHash: '0fb219790330ad',
  verified: {
    source: 'cards/overrides/ST20-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 1 card from your hand: your opponent chooses: they trash 2 cards from their hand, or you trash 1 card from the top of their Life cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          chooseOne: [
            [
              {
                do: {
                  trashFromHand: {
                    from: 'hand',
                    owner: 'opponent',
                    chooser: 'opponent',
                    pick: { exactly: 2 },
                  },
                },
              },
            ],
            [
              {
                do: {
                  move: {
                    what: { from: 'lifeTop', owner: 'opponent', pick: { exactly: 1 } },
                    to: { zone: 'trash' },
                  },
                },
              },
            ],
          ],
          chooser: 'opponent',
          labels: [
            'Trash 2 cards from your hand.',
            'Trash 1 card from the top of your Life cards.',
          ],
          neutral: [
            "Charlotte Linlin's opponent trashes 2 cards from their hand.",
            "Charlotte Linlin's player trashes 1 card from the top of their opponent's Life cards.",
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP17-049): the opponent chooses the mode even with fewer than 2 cards in hand (they trash what they have) or no Life (nothing is trashed); the Life card is trashed face up, not as damage (no [Trigger])',
  ],
};

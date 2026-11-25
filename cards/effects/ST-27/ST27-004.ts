import type { CardScript } from '../../src/dsl.ts';

/** ST27-004 Sanjuan.Wolf. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST27_004: CardScript = {
  cardId: 'ST27-004',
  textHash: '0f347be529000e',
  verified: {
    source: 'cards/overrides/ST27-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker-cost',
      label:
        'If your Leader has {Blackbeard Pirates}, this Character gains [Blocker] and +1 cost for every 4 cards in your trash',
      kind: 'permanent',
      conditions: [{ leader: { type: 'Blackbeard Pirates' } }],
      apply: [
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
        {
          cost: {
            target: { from: 'self', owner: 'you' },
            amount: { mul: [{ div: [{ trash: 'you' }, 4] }, 1] },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } }],
    },
  ],
  rulings: [
    'reading: the +1 cost steps at 4, 8, 12 cards in your trash (floor of trash / 4) and both parts need the {Blackbeard Pirates} Leader; the [On Play] trash is mandatory (it trashes a card even when the hand is only the one card) and the cost bonus is read after it',
  ],
};

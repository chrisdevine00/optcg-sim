import type { CardScript } from '../../src/dsl.ts';

/** ST17-002 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST17_002: CardScript = {
  cardId: 'ST17-002',
  textHash: '13058a676e7e22',
  verified: {
    source: 'cards/overrides/ST17-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may return 1 of your Characters to the owner\'s hand: if your Leader has the "The Seven Warlords of the Sea" type, return up to 1 Character with a cost of 4 or less to the owner\'s hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
          to: { zone: 'hand' },
        },
      ],
      effect: [
        {
          if: { leader: { type: 'The Seven Warlords of the Sea' } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: { cost: { lte: 4 } },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" follows the cost colon, so it is an effect condition: the Character is returned as the cost even when the Leader lacks the type, and nothing else happens',
    'reading: the cost may return Law himself, and the effect may return any Character of either side with a current cost of 4 or less (Law included, or the Character just returned is already in the hand)',
  ],
};

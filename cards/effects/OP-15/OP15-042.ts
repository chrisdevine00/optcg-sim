import type { CardScript } from '../../src/dsl.ts';

/** OP15-042 Kyros. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_042: CardScript = {
  cardId: 'OP15-042',
  textHash: '03169e5b1e53ac',
  verified: {
    source: 'cards/overrides/OP15-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 card from your hand: if your Leader is [Rebecca], gains [Rush]',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          if: { leader: { name: 'Rebecca' } },
          then: [
            {
              do: {
                grant: {
                  target: { from: 'self', owner: 'you' },
                  keyword: 'Rush',
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Add this Character card from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: { from: 'trash', owner: 'you', filter: { isSelf: true } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If your Leader is [Rebecca]" is after the colon, so the card is trashed even when the Leader is not [Rebecca]; the [On K.O.] add is mandatory and works from the trash only',
  ],
};

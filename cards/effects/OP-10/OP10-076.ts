import type { CardScript } from '../../src/dsl.ts';

/** OP10-076 Baby 5. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_076: CardScript = {
  cardId: 'OP10-076',
  textHash: '06af7e68322a1a',
  verified: {
    source: 'cards/overrides/OP10-076.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Trash 1 card from your hand: with a Donquixote Pirates Leader, add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['onPlay'],
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
          if: {
            leader: {
              type: 'Donquixote Pirates',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" is after the cost colon (an effect condition): the hand card is trashed even without a {Donquixote Pirates} Leader',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** ST25-004 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST25_004: CardScript = {
  cardId: 'ST25-004',
  textHash: '0ece42c6dd527f',
  verified: {
    source: 'cards/overrides/ST25-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may trash 1 card from your hand and trash this Character: if your Leader is [Buggy], play up to 1 {Cross Guild} Character card with a cost of 6 or less from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }, { trashSelf: true }],
      effect: [
        {
          if: { leader: { name: 'Buggy' } },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Cross Guild' },
                        { cost: { lte: 6 } },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If your Leader is [Buggy]" follows the cost colon, so it is an effect condition: with another Leader the cost is still paid (a card from the hand and this Character) and nothing is played',
    'reading: the card trashed as a cost leaves the hand before the play, so it cannot be the card played; "up to 1" may be declined',
  ],
};

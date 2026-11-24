import type { CardScript } from '../../src/dsl.ts';

/** OP11-069 Charlotte Brulee. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_069: CardScript = {
  cardId: 'OP11-069',
  textHash: '0e643befe265c1',
  verified: {
    source: 'cards/overrides/OP11-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may add 1 card from the top of your Life to your hand: with a {Big Mom Pirates} Leader, add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          lifeToHand: {
            from: 'top',
            n: 1,
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Big Mom Pirates',
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
    'reading: the Life card is added to the hand whether or not the Leader has the type (the "If" is after the colon); not damage, so no [Trigger]',
  ],
};

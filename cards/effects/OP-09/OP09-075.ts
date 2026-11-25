import type { CardScript } from '../../src/dsl.ts';

/** OP09-075 Eustass"Captain"Kid. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_075: CardScript = {
  cardId: 'OP09-075',
  textHash: '0c1751511568e3',
  verified: {
    source: 'cards/overrides/OP09-075.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'You may add 1 card from the top of your Life cards to your hand: with a {Kid Pirates} Leader, add up to 1 DON!! card and set it as active',
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
              type: 'Kid Pirates',
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
    'reading (RL-41): the cost moves the top Life card to the hand (not damage, no [Trigger]) and needs 1 Life card; the "If" after the colon is an effect condition, so the Life card is added to the hand even when the Leader is not {Kid Pirates}',
  ],
};

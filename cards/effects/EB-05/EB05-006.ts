import type { CardScript } from '../../src/dsl.ts';

/** EB05-006 Miss Buckingham Stussy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_006: CardScript = {
  cardId: 'EB05-006',
  textHash: '14505c826728bc',
  verified: {
    source: 'cards/overrides/EB05-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'power-swing',
      label:
        'You may add 1 card from the top of your Life cards to your hand: choose one: +3000 or -4000 power on up to 1 Character',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
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
          chooseOne: [
            [
              {
                do: {
                  power: {
                    target: {
                      from: 'characters',
                      owner: 'any',
                      pick: {
                        upTo: 1,
                      },
                    },
                    amount: 3000,
                    duration: 'thisTurn',
                  },
                },
              },
            ],
            [
              {
                do: {
                  power: {
                    target: {
                      from: 'characters',
                      owner: 'any',
                      pick: {
                        upTo: 1,
                      },
                    },
                    amount: -4000,
                    duration: 'thisTurn',
                  },
                },
              },
            ],
          ],
          labels: [
            'Give up to 1 Character +3000 power during this turn.',
            'Give up to 1 Character -4000 power during this turn.',
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Character" with no owner qualifier is any Character on the field, yours or your opponent\'s; the Life card is added to the hand without a [Trigger] (it is not damage)',
  ],
};

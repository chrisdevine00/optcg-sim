import type { CardScript } from '../../src/dsl.ts';

/** OP06-017 Meteor-Strike of Love. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP06_017: CardScript = {
  cardId: 'OP06-017',
  textHash: '1ec464ce417e09',
  verified: {
    source: 'cards/overrides/OP06-017.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main-counter',
      label: 'You may add 1 Life card to your hand: +3000 power during this turn',
      kind: 'activate',
      when: ['main', 'counter'],
      cost: [
        {
          lifeToHand: {
            from: 'top',
            n: 1,
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
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
    },
  ],
  rulings: [
    'QA-GR: adding a Life card to the hand is not damage, so there is no [Trigger] (effect-dsl 4.15)',
    'Read: the shared [Main] / [Counter] text is one ability usable at either timing; the boost lasts "during this turn" as printed, also when used as a Counter',
  ],
};

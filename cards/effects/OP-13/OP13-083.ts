import type { CardScript } from '../../src/dsl.ts';

/** OP13-083 St. Jaygarcia Saturn. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_083: CardScript = {
  cardId: 'OP13-083',
  textHash: '02546655e24aba',
  verified: {
    source: 'cards/overrides/OP13-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trash-shield',
      label:
        "With 7 or more cards in your trash, this Character cannot be removed from the field by your opponent's effects",
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              trash: 'you',
            },
            '>=',
            7,
          ],
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotBeRemovedByOpponentEffects',
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 "Five Elders" card to hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Five Elders',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Five Elders type card" is the exact type, any category; "removed from the field" is any removal by the opponent\'s effects, a battle K.O. excepted; inclusive at 7',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP03-008 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP03_008: CardScript = {
  cardId: 'OP03-008',
  textHash: '1ef364648e0626',
  verified: {
    source: 'cards/overrides/OP03-008.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'guard',
      label: 'This Character cannot be K.O.\'d in battle by "Slash" attribute cards',
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'battle', by: { attribute: 'Slash' } } },
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Look at 5 cards from the top of your deck; reveal up to 1 red Event and add it to your hand; place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { all: [{ category: ['Event'] }, { color: 'Red' }] },
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
    'reading: "in battle by Slash attribute cards" reads the attacker\'s printed attribute, Leader or Character; effects and other attributes can still K.O. it',
    'reading: the look at 5 is not gated on the deck; "up to 1 red Event" is asked at max 0 when none qualifies, the rest go to the bottom in any order (owner asked an order)',
  ],
};

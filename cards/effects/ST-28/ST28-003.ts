import type { CardScript } from '../../src/dsl.ts';

/** ST28-003 Kin'emon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST28_003: CardScript = {
  cardId: 'ST28-003',
  textHash: '08678d9eddc73e',
  verified: {
    source: 'cards/overrides/ST28-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        'If your Leader has the {Land of Wano} type and your opponent has 3 or less Life cards, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            all: [{ leader: { type: 'Land of Wano' } }, { cmp: [{ life: 'opponent' }, '<=', 3] }],
          },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
  rulings: [
    "reading: the opponent's Life is counted when the [Trigger] resolves, after the damaged Life card has left their Life area; a failed condition sends the activated card to the trash",
  ],
};

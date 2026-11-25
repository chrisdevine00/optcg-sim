import type { CardScript } from '../../src/dsl.ts';

/** OP09-086 Jesus Burgess. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_086: CardScript = {
  cardId: 'OP09-086',
  textHash: '006ca910005fea',
  verified: {
    source: 'cards/overrides/OP09-086.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'guard',
      label: "This Character cannot be K.O.'d by your opponent's effects",
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'opponentEffect' } },
          },
        },
      ],
    },
    {
      id: 'trash-power',
      label:
        'If your Leader has the {Blackbeard Pirates} type, this Character gains +1000 power for every 4 cards in your trash',
      kind: 'permanent',
      conditions: [{ leader: { type: 'Blackbeard Pirates' } }],
      apply: [
        {
          power: {
            target: { from: 'self', owner: 'you' },
            amount: { mul: [{ div: [{ trash: 'you' }, 4] }, 1000] },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the first line stops a K.O. by your opponent\'s effects only (not your own effects, not battle); the quoted "Blackbeard Pirates" is the exact type of your Leader',
    "reading: the bonus is +1000 per full 4 cards in your own trash (3 cards: +0, 4: +1000, 8: +2000), live on both players' turns, counted as the trash changes",
  ],
};

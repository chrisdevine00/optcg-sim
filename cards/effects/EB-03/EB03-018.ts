import type { CardScript } from '../../src/dsl.ts';

/** EB03-018 Tashigi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_018: CardScript = {
  cardId: 'EB03-018',
  textHash: '129a47a8379659',
  verified: {
    source: 'cards/overrides/EB03-018.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'guard',
      label:
        "[Opponent's Turn] This Character cannot be K.O.'d by your opponent's effects and gains [Blocker]",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'opponentEffect' } },
          },
        },
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
      ],
    },
    {
      id: 'end',
      label:
        'You may rest 1 of your DON!! cards and trash 1 card from your hand: set this Character as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [{ restDon: 1 }, { trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { setActive: { from: 'self', owner: 'you' } } }],
    },
  ],
  rulings: [
    "reading: the protection and [Blocker] are live only while it is the opponent's turn; on your own turn an opposing effect can K.O. her and she has no [Blocker]",
    'reading: the End of Your Turn cost is two parts, rest 1 active DON!! and trash 1 card from the hand; the use is optional by construction, and with no active DON!! or an empty hand the cost cannot be paid',
  ],
};

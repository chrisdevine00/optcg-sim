import type { CardScript } from '../../src/dsl.ts';

/** OP15-024 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_024: CardScript = {
  cardId: 'OP15-024',
  textHash: '025407e623010e',
  verified: {
    source: 'cards/overrides/OP15-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-rest',
      label: "Opponent's turn: cannot be rested by your opponent's effects and gains [Blocker]",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeRested: { by: 'opponentEffect' } },
          },
        },
        { grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } },
      ],
    },
    {
      id: 'on-ko',
      label: "Rest up to 1 of your opponent's Leader or Character cards with a cost of 7 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters'],
              owner: 'opponent',
              filter: { any: [{ category: ['Leader'] }, { cost: { lte: 7 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "by your opponent\'s Leader and Character effects" is scripted as the engine\'s "by your opponent\'s effects" (an opposing Event or Stage effect would also be stopped; the engine does not tell the source card type apart, M6b-Q30 family)',
    'reading (M6b-Q48, review OP15-R4): a Leader has no cost, so the cost limit of 7 is read as restricting the Characters only; the opposing Leader is always eligible',
  ],
};

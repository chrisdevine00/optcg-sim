import type { CardScript } from '../../src/dsl.ts';

/** OP18-037 Yokozuna. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_037: CardScript = {
  cardId: 'OP18-037',
  textHash: '0aee758c372ac9',
  verified: {
    source: 'cards/overrides/OP18-037.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label: "[On K.O.] Rest up to 1 of your opponent's cards",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters', 'stage', 'donCostArea'],
              owner: 'opponent',
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b audit Q16, as OP14-024, M6b-Q5): "your opponent\'s cards" are the Leader, Characters, Stage and active cost-area DON!!; "up to 1" may rest nothing',
  ],
};

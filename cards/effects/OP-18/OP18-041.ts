import type { CardScript } from '../../src/dsl.ts';

/** OP18-041 Ms. All Sunday (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_041: CardScript = {
  cardId: 'OP18-041',
  textHash: '0214e90d9e2258',
  verified: {
    source: 'cards/overrides/OP18-041.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'ko-draw',
      label:
        'When your Character with a type including "Baroque Works" and 3000 base power or more is K.O.\'d, draw 1 card and your opponent trashes 1 card from their hand',
      kind: 'auto',
      when: [
        {
          event: 'koed',
          filter: {
            all: [
              { category: ['Character'] },
              { typeIncludes: 'Baroque Works' },
              { basePower: { gte: 3000 } },
            ],
          },
        },
      ],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'opponent',
              chooser: 'opponent',
              pick: { exactly: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b audit row): "3000 base power" is the printed power read on the K.O.\'d card, so a Character buffed to 3000 does not count; a K.O. of any cause counts; no Once Per Turn, so two K.O.\'d Characters draw twice',
  ],
};

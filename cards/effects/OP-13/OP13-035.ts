import type { CardScript } from '../../src/dsl.ts';

/** OP13-035 Bepo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_035: CardScript = {
  cardId: 'OP13-035',
  textHash: '19f9b7d0b7ec14',
  verified: {
    source: 'cards/overrides/OP13-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end',
      label: 'Set this Character or up to 1 of your DON!! cards as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          chooseOne: [
            [{ do: { setActive: { from: 'self', owner: 'you' } } }],
            [{ do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } }],
          ],
          labels: ['Set this Character as active', 'Set up to 1 of your DON!! cards as active'],
        },
      ],
    },
  ],
};

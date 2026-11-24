import type { CardScript } from '../../src/dsl.ts';

/** OP14-071 Pica. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_071: CardScript = {
  cardId: 'OP14-071',
  textHash: '1e9f640ef9b7f4',
  verified: {
    source: 'cards/overrides/OP14-071.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end-of-turn',
      label: 'If your Leader has {Donquixote Pirates}, add up to 1 DON!! and set it as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            leader: {
              type: 'Donquixote Pirates',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

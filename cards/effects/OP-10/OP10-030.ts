import type { CardScript } from '../../src/dsl.ts';

/** OP10-030 Smoker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_030: CardScript = {
  cardId: 'OP10-030',
  textHash: '04e8d826789f65',
  verified: {
    source: 'cards/overrides/OP10-030.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Banish'],
  abilities: [
    {
      id: 'activate',
      label:
        'Set up to 1 of your DON!! as active; you cannot set DON!! as active using Character effects during this turn',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            restrict: {
              target: 'you',
              what: {
                cannotSetDonActive: {
                  by: 'characterEffects',
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the DON!! is set first (this Character effect is not yet barred) and the restriction follows; it bars Character effects only, not a Leader, Event or Stage effect or the Refresh Phase',
  ],
};

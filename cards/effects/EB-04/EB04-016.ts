import type { CardScript } from '../../src/dsl.ts';

/** EB04-016 Bird Neptunian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_016: CardScript = {
  cardId: 'EB04-016',
  textHash: '1d0564c5095de9',
  verified: {
    source: 'cards/overrides/EB04-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
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
    {
      id: 'when-attacking',
      label:
        "If you have 3 or more {Neptunian} Characters, rest up to 1 of your opponent's Characters with a cost of 8 or less",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          cmp: [
            {
              count: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Neptunian',
                },
              },
            },
            '>=',
            3,
          ],
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 8,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, you cannot ..." is not conditioned on a DON!! having been set (no "If you do"); the restriction covers every Character effect for the rest of the turn, so a second activation of this Character (no Once Per Turn) sets nothing; Leader, Stage and Event effects stay allowed; the DON!! refresh in the Refresh Phase is a rule, not an effect',
    'reading: the [When Attacking] condition counts this Character and is checked at the trigger and at resolution; "cost of 8 or less" is the current cost',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP12-016 To Never Doubt--That Is Power!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_016: CardScript = {
  cardId: 'OP12-016',
  textHash: '0c575c36753118',
  verified: {
    source: 'cards/overrides/OP12-016.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may give 2 active DON!! to your [Silvers Rayleigh]: your opponent cannot activate [Blocker] when that card attacks this turn',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          giveDon: {
            n: 2,
            state: 'active',
            to: {
              from: ['leader', 'characters'],
              owner: 'you',
              filter: {
                name: 'Silvers Rayleigh',
              },
              pick: {
                exactly: 1,
              },
              bind: 'rayleigh',
            },
          },
        },
      ],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  ref: 'rayleigh',
                },
              },
              what: 'cannotActivateBlockerAgainstIt',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'Up to 1 of your Characters or [Silvers Rayleigh] gains +2000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  any: [
                    {
                      category: ['Character'],
                    },
                    {
                      name: 'Silvers Rayleigh',
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: "the card given these DON!! cards" is the [Silvers Rayleigh] chosen for the cost (bound, Leader or Character), not always the Leader',
    'Read: [Counter] "Characters or [Silvers Rayleigh]": any of your Characters, or a Rayleigh Leader; any other Leader is not a target',
  ],
};

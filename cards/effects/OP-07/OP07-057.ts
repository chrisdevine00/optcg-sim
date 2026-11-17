import type { CardScript } from '../../src/dsl.ts';

/** OP07-057 Perfume Femur. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP07_057: CardScript = {
  cardId: 'OP07-057',
  textHash: '0f148a0ef7936a',
  verified: {
    source: 'cards/overrides/OP07-057.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Your Warlord Leader or Character gains +2000 power; if it attacks this turn, the opponent cannot activate [Blocker]',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            select: {
              from: ['leader', 'characters'],
              owner: 'you',
              filter: {
                type: 'The Seven Warlords of the Sea',
              },
              pick: {
                upTo: 1,
              },
              bind: 'chosen',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  ref: 'chosen',
                },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            restrict: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  ref: 'chosen',
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
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    '"Cannot activate [Blocker]" is its own restriction, not [Unblockable] (DECISIONS 2026-11-16 wave 1, G27)',
    'Reading: the "Then, if the selected card attacks" clause is a restriction on the selected card, so it applies only if a card was selected',
  ],
};

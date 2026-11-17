import type { CardScript } from '../../src/dsl.ts';

/** ST21-003 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_003: CardScript = {
  cardId: 'ST21-003',
  textHash: '1097842eec71d6',
  verified: {
    source: 'cards/overrides/ST21-003.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Selected Straw Hat Crew Character: your opponent cannot activate [Blocker] when it attacks this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            select: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Straw Hat Crew',
                  },
                  {
                    power: {
                      gte: 6000,
                    },
                  },
                ],
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
            restrict: {
              target: {
                from: 'characters',
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
  ],
  rulings: [
    'reading: the 6000 power is checked when selecting (current power), not when it attacks; "cannot activate [Blocker]" is not [Unblockable]',
  ],
};

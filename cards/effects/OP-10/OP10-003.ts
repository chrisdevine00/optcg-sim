import type { CardScript } from '../../src/dsl.ts';

/** OP10-003 Sugar. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_003: CardScript = {
  cardId: 'OP10-003',
  textHash: '1f739a6cf380b9',
  verified: {
    source: 'cards/overrides/OP10-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end',
      label:
        'End of your turn: with a {Donquixote Pirates} Character of 6000 power or more, set up to 1 DON!! as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Donquixote Pirates',
                  },
                  {
                    power: {
                      gte: 6000,
                    },
                  },
                ],
              },
            },
          },
          then: [
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
          ],
        },
      ],
    },
    {
      id: 'event',
      label: "Opponent's turn, once per turn, when you activate an Event: add up to 1 DON!! active",
      kind: 'auto',
      when: [
        {
          event: 'eventActivated',
          by: 'you',
        },
      ],
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      oncePerTurn: true,
      effect: [
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
  rulings: [
    'reading: "If you have a {Donquixote Pirates} Character with 6000 power or more" follows no colon: an effect condition (the ability triggers either way)',
    'reading: "activate an Event" is a [Counter] or [Main] Event activation by you; on the opponent\'s turn that is a [Counter] Event',
  ],
};

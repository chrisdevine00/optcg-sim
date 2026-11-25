import type { CardScript } from '../../src/dsl.ts';

/** OP10-086 Shiryu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_086: CardScript = {
  cardId: 'OP10-086',
  textHash: '08797fa7c0ce95',
  verified: {
    source: 'cards/overrides/OP10-086.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-power',
      label: "[Opponent's Turn] This Character gains +2000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        'With a Blackbeard Pirates Leader, if this Character was played this turn: K.O. up to 1 opposing Character with a base cost of 3 or less',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Blackbeard Pirates',
                },
              },
              {
                self: {
                  playedThisTurn: true,
                },
              },
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    baseCost: {
                      lte: 3,
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
    },
  ],
  rulings: [
    'reading: the "If" has no colon before it, so it is an effect condition (DECISIONS 2026-11-24, B3A-R1): the Activate is always offered and spends its Once Per Turn, and does nothing on a later turn or without a {Blackbeard Pirates} Leader',
    'reading: "base cost of 3 or less" reads the printed cost, so a Character raised by a cost effect still qualifies and a lowered one does not',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP14-034 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_034: CardScript = {
  cardId: 'OP14-034',
  textHash: '1ec7fe61864298',
  verified: {
    source: 'cards/overrides/OP14-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'boost',
      label:
        'Your turn: all your green {Straw Hat Crew} Characters with a base cost of 4 or more gain +1000 power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    color: 'Green',
                  },
                  {
                    type: 'Straw Hat Crew',
                  },
                  {
                    baseCost: {
                      gte: 4,
                    },
                  },
                ],
              },
            },
            amount: 1000,
          },
        },
      ],
    },
    {
      id: 'shield',
      label:
        "[Once Per Turn] instead of your {Straw Hat Crew} Character being K.O.'d by the opponent's effect, you may rest 1 of your Characters",
      kind: 'replacement',
      oncePerTurn: true,
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            type: 'Straw Hat Crew',
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          rest: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "green {Straw Hat Crew}" is a multicolor card with green too (color filter); this Character (base cost 3, so not in the boost) may be the Character rested; the K.O. of the opposing effect only is replaced (a bounce is not, M6b audit)',
  ],
};

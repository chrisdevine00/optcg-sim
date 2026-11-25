import type { CardScript } from '../../src/dsl.ts';

/** OP11-043 Vinsmoke Ichiji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_043: CardScript = {
  cardId: 'OP11-043',
  textHash: '1afc70b3b8b737',
  verified: {
    source: 'cards/overrides/OP11-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-attack',
      label:
        'With only {GERMA} Characters: a Leader or Character gains +1000 power during this battle; then trash 2 cards from the top of your deck',
      kind: 'auto',
      optional: true,
      oncePerTurn: true,
      when: ['onOpponentAttack'],
      conditions: [
        {
          all: [
            {
              exists: {
                from: 'characters',
                owner: 'you',
              },
            },
            {
              none: {
                from: 'characters',
                owner: 'you',
                filter: {
                  not: {
                    typeIncludes: 'GERMA',
                  },
                },
              },
            },
          ],
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 1000,
              duration: 'battle',
            },
          },
        },
        {
          do: {
            mill: {
              player: 'you',
              n: 2,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading (as OP13-095): "you only have Characters with a type including GERMA" is false with no Characters; this Character counts itself ({GERMA 66})',
    'reading: the condition is an activation condition (the Once Per Turn is not used when it is false); the boost is "up to 1" and the trash 2 follows regardless ("Then" is not "If you do")',
  ],
};

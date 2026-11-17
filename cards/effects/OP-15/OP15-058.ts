import type { CardScript } from '../../src/dsl.ts';

/** OP15-058 Enel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_058: CardScript = {
  cardId: 'OP15-058',
  textHash: '1626963e935c87',
  verified: {
    source: 'cards/overrides/OP15-058.json (card text in cards/data)',
    date: '2026-11-16',
  },
  rules: [
    {
      donDeckSize: 6,
    },
  ],
  abilities: [
    {
      id: 'enel-surge',
      label:
        'From your second turn: add 1 DON!! active and 4 rested, then give up to 4 rested DON!! to a Character',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            cmp: [
              {
                turnIndex: 'you',
              },
              '>=',
              2,
            ],
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
                  {
                    n: 4,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
            {
              do: {
                giveDon: {
                  n: 4,
                  state: 'rested',
                  to: {
                    from: 'characters',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
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
    'QA-OP15 OP15-058 (RL-40): DON!! deck of 6, "second turn or later" blocks the first turn',
    'reading: "Then, give" follows the "if", so it is inside the guard (always true when the guard is)',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP17-010 Fossa. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_010: CardScript = {
  cardId: 'OP17-010',
  textHash: '1989a3f8fa02e9',
  verified: {
    source: 'cards/overrides/OP17-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label:
        "If your opponent has a Character with 10000 power or more and you have no other [Fossa], this Character gains [Blocker] and +2000 power until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'opponent',
            filter: {
              power: {
                gte: 10000,
              },
            },
          },
        },
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  name: 'Fossa',
                },
                {
                  isSelf: false,
                },
              ],
            },
          },
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Blocker',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 2000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};

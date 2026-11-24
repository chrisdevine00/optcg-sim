import type { CardScript } from '../../src/dsl.ts';

/** OP16-036 Mr.2.Bon.Kurei(Bentham). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_036: CardScript = {
  cardId: 'OP16-036',
  textHash: '0ea4ebe5624ee8',
  verified: {
    source: 'cards/overrides/OP16-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
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
    {
      id: 'copy-leader',
      label:
        "This Character's base power becomes the same as your opponent's Leader during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            select: {
              from: 'leader',
              owner: 'opponent',
              bind: 'oppLeader',
            },
          },
        },
        {
          do: {
            setBasePower: {
              target: {
                from: 'self',
                owner: 'you',
              },
              value: {
                refStat: 'oppLeader',
                stat: 'power',
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

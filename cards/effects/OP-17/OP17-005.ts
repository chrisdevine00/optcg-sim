import type { CardScript } from '../../src/dsl.ts';

/** OP17-005 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_005: CardScript = {
  cardId: 'OP17-005',
  textHash: '089348822148f6',
  verified: {
    source: 'cards/overrides/OP17-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -4 cost if your opponent has a Character with 10000 power or more',
      kind: 'permanent',
      zone: 'hand',
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
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: -4,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "Your monocolored Leader's base power becomes 8000 until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setBasePower: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  not: {
                    multicolor: true,
                  },
                },
              },
              value: 8000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};

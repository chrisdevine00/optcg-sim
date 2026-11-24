import type { CardScript } from '../../src/dsl.ts';

/** OP16-003 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_003: CardScript = {
  cardId: 'OP16-003',
  textHash: '11055b0fdc53d3',
  verified: {
    source: 'cards/overrides/OP16-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'your-turn',
      label: 'Your Leader gains [Double Attack] and +2000 power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'leader',
              owner: 'you',
            },
            keyword: 'Double Attack',
          },
        },
        {
          power: {
            target: {
              from: 'leader',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "You may reveal 2 Character cards with 8000 power from your hand: up to 1 of your opponent's Characters gets -6000 power",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 8000,
                  },
                },
              ],
            },
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              amount: -6000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

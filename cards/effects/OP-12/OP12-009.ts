import type { CardScript } from '../../src/dsl.ts';

/** OP12-009 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_009: CardScript = {
  cardId: 'OP12-009',
  textHash: '00becd0af8603d',
  verified: {
    source: 'cards/overrides/OP12-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Reveal 2 Events: this Character gains [Rush]; then +1000 power until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
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
            grant: {
              target: {
                from: 'self',
                owner: 'you',
              },
              keyword: 'Rush',
              duration: 'thisTurn',
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
              amount: 1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: ['Read: "Then" is not "If you do": both halves follow the paid cost and nothing else'],
};

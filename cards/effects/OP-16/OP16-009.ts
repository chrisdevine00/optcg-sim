import type { CardScript } from '../../src/dsl.ts';

/** OP16-009 Speed Jil. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_009: CardScript = {
  cardId: 'OP16-009',
  textHash: '1ece1f837fcec4',
  verified: {
    source: 'cards/overrides/OP16-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 Character card with 8000 power from your hand: this Character gains [Rush] and +2000 power until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
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
              exactly: 1,
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

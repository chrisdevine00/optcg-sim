import type { CardScript } from '../../src/dsl.ts';

/** OP16-073 Borsalino. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_073: CardScript = {
  cardId: 'OP16-073',
  textHash: '1a754f9eca3ca0',
  verified: {
    source: 'cards/overrides/OP16-073.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 active DON!! and up to 1 additional rested DON!!',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'end-turn',
      label:
        "DON!! -2: set this Character as active; it gains [Blocker] until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'self',
              owner: 'you',
            },
          },
        },
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
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** EB04-007 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_007: CardScript = {
  cardId: 'EB04-007',
  textHash: '1e9797bec48a80',
  verified: {
    source: 'cards/overrides/EB04-007.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Your Leader gains +2000 power until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 2000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'rush-character',
      label: 'If your opponent has a Character with 8000 power or more, gains [Rush: Character]',
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
                gte: 8000,
              },
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
              keyword: 'Rush: Character',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the opponent power condition is checked when the ability is activated (CR 8-3-2-3), and Once Per Turn is spent by activating it',
  ],
};

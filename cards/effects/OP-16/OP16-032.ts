import type { CardScript } from '../../src/dsl.ts';

/** OP16-032 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_032: CardScript = {
  cardId: 'OP16-032',
  textHash: '0b27c304e5e7a5',
  verified: {
    source: 'cards/overrides/OP16-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Unblockable'],
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 of your opponent's Characters other than [Monkey.D.Luffy] cannot be rested until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  not: {
                    name: 'Monkey.D.Luffy',
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};

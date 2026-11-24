import type { CardScript } from '../../src/dsl.ts';

/** OP16-095 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_095: CardScript = {
  cardId: 'OP16-095',
  textHash: '02c8824b1c36fd',
  verified: {
    source: 'cards/overrides/OP16-095.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your black {Land of Wano} Characters gains [Unblockable] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { all: [{ color: 'Black' }, { type: 'Land of Wano' }] },
                pick: { upTo: 1 },
              },
              keyword: 'Unblockable',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

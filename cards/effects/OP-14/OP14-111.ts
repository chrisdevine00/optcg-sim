import type { CardScript } from '../../src/dsl.ts';

/** OP14-111 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_111: CardScript = {
  cardId: 'OP14-111',
  textHash: '0720ea151e73e5',
  verified: {
    source: 'cards/overrides/OP14-111.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play-ko',
      label:
        "Up to 1 of your opponent's Characters with a cost of 6 or less cannot attack until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onPlay', 'onKO'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 6 } },
                pick: { upTo: 1 },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'Play up to 1 {Thriller Bark Pirates} Character with a cost of 4 or less from your trash rested',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Thriller Bark Pirates' },
                    { cost: { lte: 4 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
};

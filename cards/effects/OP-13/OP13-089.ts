import type { CardScript } from '../../src/dsl.ts';

/** OP13-089 St. Topman Warcury. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_089: CardScript = {
  cardId: 'OP13-089',
  textHash: '02366e57cf50bd',
  verified: {
    source: 'cards/overrides/OP13-089.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'protect',
      label: 'With 7+ cards in trash: cannot be removed by opponent effects and gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              trash: 'you',
            },
            '>=',
            7,
          ],
        },
      ],
      apply: [
        {
          restrict: {
            target: {
              from: 'self',
              owner: 'you',
            },
            what: 'cannotBeRemovedByOpponentEffects',
          },
        },
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
};

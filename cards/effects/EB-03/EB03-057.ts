import type { CardScript } from '../../src/dsl.ts';

/** EB03-057 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_057: CardScript = {
  cardId: 'EB03-057',
  textHash: '0e35a3d569985b',
  verified: {
    source: 'cards/overrides/EB03-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Give up to 3 rested DON!! cards to your {Land of Wano} type Leader',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 3,
              state: 'rested',
              to: { from: 'leader', owner: 'you', filter: { type: 'Land of Wano' } },
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: "Trash up to 1 card from the top of your opponent's Life cards",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: { from: 'lifeTop', owner: 'opponent', pick: { upTo: 1 } },
              to: { zone: 'trash' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'G30: trashing a Life card is not damage: no [Trigger]; the card goes face up to the trash',
  ],
};

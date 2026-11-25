import type { CardScript } from '../../src/dsl.ts';

/** ST15-004 Thatch. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST15_004: CardScript = {
  cardId: 'ST15-004',
  textHash: '15ff20828be7da',
  verified: {
    source: 'cards/overrides/ST15-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader\'s type includes "Whitebeard Pirates", give up to 1 of your opponent\'s Characters -2000 power during this turn; then add 1 card from the top of your Life cards to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { typeIncludes: 'Whitebeard Pirates' } },
          then: [
            {
              do: {
                power: {
                  target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
                  amount: -2000,
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                move: {
                  what: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, add 1 card from the top of your Life" is inside the guard (M4b-5) and mandatory (no "up to"/"may"), so a Leader without the type neither gives -2000 nor takes Life; with no Life nothing is added',
  ],
};

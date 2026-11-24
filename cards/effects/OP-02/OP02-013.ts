import type { CardScript } from '../../src/dsl.ts';

/** OP02-013 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP02_013: CardScript = {
  cardId: 'OP02-013',
  textHash: '0aeeb3e786544f',
  verified: {
    source: 'cards/overrides/OP02-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Give up to 2 of your opponent\'s Characters -3000 power during this turn; if your Leader\'s type includes "Whitebeard Pirates", this Character gains [Rush] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 2 } },
              amount: -3000,
              duration: 'thisTurn',
            },
          },
        },
        {
          if: { leader: { typeIncludes: 'Whitebeard Pirates' } },
          then: [
            {
              do: {
                grant: {
                  target: { from: 'self', owner: 'you' },
                  keyword: 'Rush',
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading (M4b-5, M6b-Q13): "Then, if your Leader\'s type includes ..." is its own condition; Rush is granted even when no opposing Character was chosen',
  ],
};

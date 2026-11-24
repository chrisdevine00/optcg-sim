import type { CardScript } from '../../src/dsl.ts';

/** EB03-050 Conis. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_050: CardScript = {
  cardId: 'EB03-050',
  textHash: '12d4482089ef5a',
  verified: {
    source: 'cards/overrides/EB03-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 of your {Sky Island} Characters gains [Double Attack] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { type: 'Sky Island' },
                pick: { upTo: 1 },
              },
              keyword: 'Double Attack',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

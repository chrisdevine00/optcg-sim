import type { CardScript } from '../../src/dsl.ts';

/** OP13-024 Gordon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_024: CardScript = {
  cardId: 'OP13-024',
  textHash: '09b445be9802b0',
  verified: {
    source: 'cards/overrides/OP13-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal 1 Music or FILM card from your hand: set up to 2 DON!! active at the end of this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              any: [
                {
                  type: 'Music',
                },
                {
                  type: 'FILM',
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          delayed: {
            at: 'endOfThisTurn',
          },
          do: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP10-009 Smiley. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_009: CardScript = {
  cardId: 'OP10-009',
  textHash: '003738ee444e67',
  verified: {
    source: 'cards/overrides/OP10-009.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the "Punk Hazard" type, give up to 1 of your opponent\'s Characters -3000 power',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Punk Hazard',
            },
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -3000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

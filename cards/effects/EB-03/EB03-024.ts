import type { CardScript } from '../../src/dsl.ts';

/** EB03-024. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_024: CardScript = {
  cardId: 'EB03-024',
  textHash: '1b3cc0fc02801d',
  verified: {
    source: 'cards/overrides/EB03-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Play up to 1 {Alabasta} or {Straw Hat Crew} Character with a cost of 5 or less from your hand; then you cannot play any Character cards during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      any: [
                        {
                          type: 'Alabasta',
                        },
                        {
                          type: 'Straw Hat Crew',
                        },
                      ],
                    },
                    {
                      cost: {
                        lte: 5,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
        {
          do: {
            restrict: {
              target: 'you',
              what: {
                cannotPlay: {
                  category: ['Character'],
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "you cannot play any Character cards on your field" is read as "cannot play Character cards" (a play by any means, effects included), as OP14-024 Kin\'emon; "Then" is not "If you do", so it applies even when nothing was played',
  ],
};

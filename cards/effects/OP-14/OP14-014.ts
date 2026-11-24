import type { CardScript } from '../../src/dsl.ts';

/** OP14-014 Eustass"Captain"Kid. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_014: CardScript = {
  cardId: 'OP14-014',
  textHash: '1ea1d99414fd05',
  verified: {
    source: 'cards/overrides/OP14-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has {Supernovas}, play up to 1 red Character with 2000 power or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Supernovas',
            },
          },
          then: [
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
                          color: 'Red',
                        },
                        {
                          power: {
                            lte: 2000,
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
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the play is not gated on what the hand holds (a gate would show the opponent the hand); the empty "up to 1" choice is asked',
  ],
};

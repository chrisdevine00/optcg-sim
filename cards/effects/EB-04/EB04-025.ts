import type { CardScript } from '../../src/dsl.ts';

/** EB04-025 Nefeltari Vivi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_025: CardScript = {
  cardId: 'EB04-025',
  textHash: '035f589ca3896e',
  verified: {
    source: 'cards/overrides/EB04-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Play up to 1 {Alabasta} Character with cost 8 or less other than [Nefeltari Vivi] from your hand; then your opponent places 1 card from their hand at the bottom of their deck',
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
                      type: 'Alabasta',
                    },
                    {
                      cost: {
                        lte: 8,
                      },
                    },
                    {
                      not: {
                        name: 'Nefeltari Vivi',
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
            move: {
              what: {
                from: 'hand',
                owner: 'opponent',
                chooser: 'opponent',
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is independent of the play (not "if you do"): the opponent places a card whether or not you played one; with an empty hand nothing is placed',
  ],
};

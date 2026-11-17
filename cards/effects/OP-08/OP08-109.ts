import type { CardScript } from '../../src/dsl.ts';

/** OP08-109 Mont Blanc Noland. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP08_109: CardScript = {
  cardId: 'OP08-109',
  textHash: '03aa4c61b2b5b7',
  verified: {
    source: 'cards/overrides/OP08-109.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is {Shandian Warrior} and you have a [Kalgara] Character, add up to 1 deck card to the top of Life',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              { leader: { type: 'Shandian Warrior' } },
              { exists: { from: 'characters', owner: 'you', filter: { name: 'Kalgara' } } },
            ],
          },
          then: [
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

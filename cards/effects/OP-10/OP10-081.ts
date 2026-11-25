import type { CardScript } from '../../src/dsl.ts';

/** OP10-081 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_081: CardScript = {
  cardId: 'OP10-081',
  textHash: '170d4a1849c661',
  verified: {
    source: 'cards/overrides/OP10-081.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Rest 1 of your Dressrosa Leader or Stage: K.O. up to 1 opposing Character with a cost of 2 or less; then trash 2 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            filter: {
              type: 'Dressrosa',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 2,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            mill: {
              player: 'you',
              n: 2,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, trash 2 cards from the top of your deck" is not "If you do": it happens whether or not a Character was K.O.\'d (there is no "If" before it)',
  ],
};

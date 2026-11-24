import type { CardScript } from '../../src/dsl.ts';

/** OP16-093 Bartholomew Kuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_093: CardScript = {
  cardId: 'OP16-093',
  textHash: '0e9088e5a0e2a8',
  verified: {
    source: 'cards/overrides/OP16-093.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2, trash 2, then give up to 1 rested DON!! to your Leader or a Character',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the DON!! is given even when fewer than 2 cards could be trashed; "give up to 1" uses the engine-wide giveDon shape (it gives when a rested DON!! and a target exist)',
  ],
};

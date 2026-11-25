import type { CardScript } from '../../src/dsl.ts';

/** EB03-051 Charlotte Smoothie. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_051: CardScript = {
  cardId: 'EB03-051',
  textHash: '104654bf1101e4',
  verified: {
    source: 'cards/overrides/EB03-051.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have a face-up Life card, K.O. up to 1 of your opponent's Characters with a cost of 2 or less; then turn all of your Life cards face-down",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ lifeFaceUp: 'you' }, '>=', 1] },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 2 } },
                  pick: { upTo: 1 },
                },
              },
            },
            { do: { turnLifeFaceDown: 'all' } },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (M4b-5): "Then, turn all of your Life cards face-down" follows the "If you have a face-up Life card" clause, so it sits inside the guard (with none face-up nothing happens); the K.O. is "up to 1" and the Life turn happens whether or not a Character was K.O.\'d (not "if you do"); the face-up count is public',
  ],
};

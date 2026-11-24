import type { CardScript } from '../../src/dsl.ts';

/** EB03-045 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_045: CardScript = {
  cardId: 'EB03-045',
  textHash: '0779872ec35dda',
  verified: {
    source: 'cards/overrides/EB03-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Give up to 1 rested DON!! to your Leader or 1 of your Characters; then, with 10 or more cards in your trash, play up to 1 {Thriller Bark Pirates} Character with a cost of 2 or less from your trash rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
        {
          if: { cmp: [{ trash: 'you' }, '>=', 10] },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Thriller Bark Pirates' },
                        { cost: { lte: 2 } },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                  rested: true,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Reading: "Then, if you have 10 or more cards in your trash" is checked whether or not a DON!! card was given (as EB03-053 Nami)',
  ],
};

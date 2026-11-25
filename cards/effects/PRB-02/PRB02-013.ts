import type { CardScript } from '../../src/dsl.ts';

/** PRB02-013 Gecko Moria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_013: CardScript = {
  cardId: 'PRB02-013',
  textHash: '118080379d1485',
  verified: {
    source: 'cards/overrides/PRB02-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the "Thriller Bark Pirates" type, play up to 1 Character with a cost of 4 or less from your trash rested; then give up to 1 rested DON!! to your Leader or 1 Character',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Thriller Bark Pirates' } },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: { all: [{ category: ['Character'] }, { cost: { lte: 4 } }] },
                    pick: { upTo: 1 },
                  },
                  rested: true,
                },
              },
            },
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
    },
  ],
  rulings: [
    'reading: "Then, give" is inside the guard (M4b-5): with the Leader not {Thriller Bark Pirates} nothing resolves; the give is not conditional on a Character having been played',
    'reading: the played Character may take the DON!! (it is one of your Characters by then)',
  ],
};

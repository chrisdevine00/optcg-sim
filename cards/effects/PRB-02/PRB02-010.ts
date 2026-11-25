import type { CardScript } from '../../src/dsl.ts';

/** PRB02-010 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_010: CardScript = {
  cardId: 'PRB02-010',
  textHash: '1d685c8f4380d5',
  verified: {
    source: 'cards/overrides/PRB02-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -2: if your Leader has the "Big Mom Pirates" type and your opponent has 6 or more DON!!, draw 2, then play up to 1 "Big Mom Pirates" Character with 6000 to 8000 power from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 2 }],
      effect: [
        {
          if: {
            all: [
              { leader: { type: 'Big Mom Pirates' } },
              { cmp: [{ donOnField: 'opponent' }, '>=', 6] },
            ],
          },
          then: [
            { do: { draw: 2 } },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Big Mom Pirates' },
                        { power: { gte: 6000 } },
                        { power: { lte: 8000 } },
                      ],
                    },
                    pick: { upTo: 1 },
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
    'reading: the "If" follows the DON!! -2 colon, so it is an effect condition: with it false the DON!! is still returned and nothing happens',
    'reading: "Then, play" is inside the guard (M4b-5): with the "If" false it does not resolve; "6000 to 8000" is inclusive, in the hand the printed power; the played Character must be a Character card of the {Big Mom Pirates} type',
    'reading: "6 or more DON!! cards on their field" counts the cost area and DON!! given to cards; the DON!! -2 is paid first and does not affect the opponent',
  ],
};

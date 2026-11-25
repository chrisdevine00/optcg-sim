import type { CardScript } from '../../src/dsl.ts';

/** OP09-104 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_104: CardScript = {
  cardId: 'OP09-104',
  textHash: '1707dc9a5ef0a3',
  verified: {
    source: 'cards/overrides/OP09-104.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Add up to 1 {Revolutionary Army} Character card from your hand to the top of your Life cards face-up; then, if you have 2 or more Life cards, add 1 card from the top or bottom of your Life cards to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { all: [{ category: ['Character'] }, { type: 'Revolutionary Army' }] },
                pick: { upTo: 1 },
              },
              to: { zone: 'life', position: 'top', faceUp: true },
            },
          },
        },
        {
          if: { cmp: [{ life: 'you' }, '>=', 2] },
          then: [
            {
              do: {
                move: {
                  what: { from: 'lifeTopOrBottom', owner: 'you', pick: { exactly: 1 } },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader is multicolored, draw 2 cards',
      kind: 'trigger',
      effect: [{ if: { leader: { multicolor: true } }, then: [{ do: { draw: 2 } }] }],
    },
  ],
  rulings: [
    'reading (G45): the card from the Life top or bottom is a blind choice of end and mandatory with 2 or more Life cards after the first step (counted after the Sabo move); not damage, no [Trigger]',
    'reading: "Then, if you have 2 or more Life cards" is a separate effect condition, true even when no card was added; the hand pick is "up to 1", asked at max 0 with no match; the added card is face-up',
    'reading: [Trigger] "If your Leader is multicolored" is an effect condition (colon-less): the Trigger is spent and nothing is drawn with a single-colour Leader',
  ],
};

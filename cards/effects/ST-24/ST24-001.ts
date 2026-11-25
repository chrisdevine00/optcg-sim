import type { CardScript } from '../../src/dsl.ts';

/** ST24-001 Capone"Gang"Bege. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST24_001: CardScript = {
  cardId: 'ST24-001',
  textHash: '17cae702cf08e8',
  verified: {
    source: 'cards/overrides/ST24-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'With 6+ rested cards: draw 1 card and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                sum: [
                  { count: { from: 'field', owner: 'you', filter: { state: 'rested' } } },
                  { donOnField: 'you', state: 'rested' },
                ],
              },
              '>=',
              6,
            ],
          },
          then: [
            { do: { draw: 1 } },
            { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
          ],
        },
      ],
    },
  ],
  rulings: [
    'M6b-Q25 (as OP12-118): "rested cards" = rested Leader, Characters and Stage plus rested DON!! in the cost area; this card, just played active, is not counted. "If you have 6 or more rested cards" follows no colon: an effect condition read when the effect resolves',
  ],
};

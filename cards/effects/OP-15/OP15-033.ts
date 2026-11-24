import type { CardScript } from '../../src/dsl.ts';

/** OP15-033 Hody Jones. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_033: CardScript = {
  cardId: 'OP15-033',
  textHash: '143cf0a77bbd5a',
  verified: {
    source: 'cards/overrides/OP15-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Set your Fish-Man Leader as active. Then add 1 card from the top of your Life to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { setActive: { from: 'leader', owner: 'you', filter: { type: 'Fish-Man' } } } },
        {
          do: {
            move: {
              what: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "If you do": the Life card is added even when the Leader is not {Fish-Man} or is already active; the add is mandatory (no "up to")',
  ],
};

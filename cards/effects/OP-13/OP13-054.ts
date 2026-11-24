import type { CardScript } from '../../src/dsl.ts';

/** OP13-054 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_054: CardScript = {
  cardId: 'OP13-054',
  textHash: '17ee37bf9e1ca6',
  verified: {
    source: 'cards/overrides/OP13-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have 3 or less Life cards, draw 2 cards; then give up to 1 rested DON!! card to your Leader',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ life: 'you' }, '<=', 3] },
          then: [
            { do: { draw: 2 } },
            { do: { giveDon: { n: 1, state: 'rested', to: { from: 'leader', owner: 'you' } } } },
          ],
        },
      ],
    },
  ],
};

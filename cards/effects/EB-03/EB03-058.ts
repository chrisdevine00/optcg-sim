import type { CardScript } from '../../src/dsl.ts';

/** EB03-058 Lilith. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_058: CardScript = {
  cardId: 'EB03-058',
  textHash: '04cda868c2d027',
  verified: {
    source: 'cards/overrides/EB03-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Your turn: if you have 2 or less Life cards, draw 1',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [{ yourTurn: true }],
      effect: [
        {
          if: { cmp: [{ life: 'you' }, '<=', 2] },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'If your Leader is [Vegapunk], play this card',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { name: 'Vegapunk' } },
          then: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
        },
      ],
    },
  ],
};

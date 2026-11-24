import type { CardScript } from '../../src/dsl.ts';

/** OP15-104 Conis. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_104: CardScript = {
  cardId: 'OP15-104',
  textHash: '060f0c59201d40',
  verified: {
    source: 'cards/overrides/OP15-104.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have less Life cards than your opponent, draw 2 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ life: 'you' }, '<', { life: 'opponent' }] },
          then: [
            { do: { draw: 2 } },
            { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
  ],
};

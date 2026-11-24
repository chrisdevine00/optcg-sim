import type { CardScript } from '../../src/dsl.ts';

/** OP15-087 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_087: CardScript = {
  cardId: 'OP15-087',
  textHash: '046330e1e0ed22',
  verified: {
    source: 'cards/overrides/OP15-087.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'If you have 10 or more cards in your trash, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [{ cmp: [{ trash: 'you' }, '>=', 10] }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } }],
    },
    {
      id: 'on-play',
      label: 'Draw 2 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 2 } },
        {
          do: {
            trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } },
          },
        },
      ],
    },
  ],
};

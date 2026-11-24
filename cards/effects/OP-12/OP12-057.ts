import type { CardScript } from '../../src/dsl.ts';

/** OP12-057 Ice Block Pheasant Peck. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_057: CardScript = {
  cardId: 'OP12-057',
  textHash: '0cac690f1314c6',
  verified: {
    source: 'cards/overrides/OP12-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Character cards gains +4000 power during this battle; then trash 1 card from your hand',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
    {
      id: 'trigger',
      label: 'You may trash 1 card from your hand: draw 1 card',
      kind: 'trigger',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'Reading: "Then, trash 1 card" is not "If you do": the trash is mandatory and happens even when no target was chosen; with an empty hand nothing is trashed',
  ],
};

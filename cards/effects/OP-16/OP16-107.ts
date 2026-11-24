import type { CardScript } from '../../src/dsl.ts';

/** OP16-107 Jesus Burgess. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_107: CardScript = {
  cardId: 'OP16-107',
  textHash: '0abe2943d73aa6',
  verified: {
    source: 'cards/overrides/OP16-107.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "Add up to 1 card from the top of your opponent's Life to its owner's hand",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: { from: 'lifeTop', owner: 'opponent', pick: { upTo: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Trash 1 card from your hand: play this card',
      kind: 'trigger',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
};

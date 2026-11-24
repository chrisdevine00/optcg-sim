import type { CardScript } from '../../src/dsl.ts';

/** ST33-003 Smoker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST33_003: CardScript = {
  cardId: 'ST33-003',
  textHash: '0643ad1ac10bab',
  verified: {
    source: 'cards/overrides/ST33-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may trash 1 card from your hand: place up to 2 of your opponent's Characters with cost 2 or less at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 2 } },
                pick: { upTo: 2 },
              },
              to: { zone: 'deck', position: 'bottom' },
            },
          },
        },
      ],
    },
  ],
};

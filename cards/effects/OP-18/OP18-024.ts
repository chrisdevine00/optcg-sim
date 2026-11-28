import type { CardScript } from '../../src/dsl.ts';

/** OP18-024 Kokoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_024: CardScript = {
  cardId: 'OP18-024',
  textHash: '113015ee82c82b',
  verified: {
    source: 'cards/overrides/OP18-024.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'end',
      label: 'You may trash this Character: set your Leader as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'leader',
              owner: 'you',
            },
          },
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP16-094 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_094: CardScript = {
  cardId: 'OP16-094',
  textHash: '0a6839aaca2e5a',
  verified: {
    source: 'cards/overrides/OP16-094.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Your opponent trashes 2 cards from their hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'opponent',
              chooser: 'opponent',
              pick: { exactly: 2 },
            },
          },
        },
      ],
    },
    {
      id: 'give-don',
      label: 'Give up to 1 rested DON!! to your {Land of Wano} Leader or Character',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'Land of Wano' },
                pick: { exactly: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};

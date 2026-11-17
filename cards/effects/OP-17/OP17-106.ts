import type { CardScript } from '../../src/dsl.ts';

/** OP17-106 Charlotte Smoothie. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_106: CardScript = {
  cardId: 'OP17-106',
  textHash: '1406ed9f4fb471',
  verified: {
    source: 'cards/overrides/OP17-106.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Rest 2 DON!!: add 1 card from your deck to your Life; your opponent trashes 1 card from their hand',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      cost: [
        {
          restDon: 2,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'opponent',
              chooser: 'opponent',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};

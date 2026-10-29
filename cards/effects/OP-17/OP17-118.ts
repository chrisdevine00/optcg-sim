import type { CardScript } from '../../src/dsl.ts';

/** OP17-118 Rocks.D.Xebec. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_118: CardScript = {
  cardId: 'OP17-118',
  textHash: '15e8f2e9d3b83b',
  verified: {
    source: 'cards/overrides/OP17-118.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'hand-counter',
      label: '+2000 Counter in hand while all your Characters lack a Counter',
      kind: 'permanent',
      zone: 'hand',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
          },
        },
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              hasCounter: true,
            },
          },
        },
      ],
      apply: [
        {
          counter: {
            target: {
              from: 'self',
              owner: 'you',
            },
            value: 2000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'Draw 1 and play up to 2 {Rocks Pirates} cards (different names, total cost 9 or less)',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  type: 'Rocks Pirates',
                },
                pick: {
                  upTo: 2,
                  distinctNames: true,
                  totalCost: {
                    lte: 9,
                  },
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'QA-OP17 OP17-118: with 0 Characters it has no Counter; playing only 1 card is allowed',
  ],
};

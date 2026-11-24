import type { CardScript } from '../../src/dsl.ts';

/** OP15-048 Chinjao. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_048: CardScript = {
  cardId: 'OP15-048',
  textHash: '1e9d8d9d8820bc',
  verified: {
    source: 'cards/overrides/OP15-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 Event from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              category: ['Event'],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        "[Opponent's Turn] Your opponent places 1 card from their hand at the bottom of their deck",
      kind: 'auto',
      when: ['onKO'],
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'opponent',
                chooser: 'opponent',
                pick: {
                  exactly: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
};

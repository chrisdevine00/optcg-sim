import type { CardScript } from '../../src/dsl.ts';

/** OP17-114 Sweet 3 Generals. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_114: CardScript = {
  cardId: 'OP17-114',
  textHash: '17621098add5ea',
  verified: {
    source: 'cards/overrides/OP17-114.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Rest 2 DON!!: draw 1, add 1 deck card to your Life; give up to 2 opponent Characters -3000 power',
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
            draw: 1,
          },
        },
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
            power: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 2,
                },
              },
              amount: -3000,
              duration: 'thisTurn',
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

import type { CardScript } from '../../src/dsl.ts';

/** OP16-063 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_063: CardScript = {
  cardId: 'OP16-063',
  textHash: '0006d5bd922e21',
  verified: {
    source: 'cards/overrides/OP16-063.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 2 DON!! from your DON!! deck and rest them',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 2,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
    {
      id: 'no-block',
      label:
        "DON!! -1: up to 1 of your opponent's Characters cannot activate [Blocker] during this turn",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              what: 'cannotActivateBlocker',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

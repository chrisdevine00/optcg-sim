import type { CardScript } from '../../src/dsl.ts';

/** OP13-028 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_028: CardScript = {
  cardId: 'OP13-028',
  textHash: '09eff8de9d0285',
  verified: {
    source: 'cards/overrides/OP13-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Set all your DON!! active; you cannot play cards from your hand this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                any: true,
              },
            },
          },
        },
        {
          do: {
            restrict: {
              target: 'you',
              what: {
                cannotPlay: {
                  category: ['Character', 'Event', 'Stage'],
                },
                from: 'hand',
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

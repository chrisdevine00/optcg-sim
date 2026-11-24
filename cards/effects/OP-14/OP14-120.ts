import type { CardScript } from '../../src/dsl.ts';

/** OP14-120 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_120: CardScript = {
  cardId: 'OP14-120',
  textHash: '1bf170f0cd57e3',
  verified: {
    source: 'cards/overrides/OP14-120.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 of your opponent's cost 9 or less Characters cannot attack until the end of your opponent's next End Phase; then draw 1 if your opponent has a cost 0 or 8+ Character",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 9 } },
                pick: { upTo: 1 },
              },
              what: 'cannotAttack',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
        {
          if: {
            any: [
              { exists: { from: 'characters', owner: 'opponent', filter: { cost: { eq: 0 } } } },
              { exists: { from: 'characters', owner: 'opponent', filter: { cost: { gte: 8 } } } },
            ],
          },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'You may trash 1 card from your hand: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
};

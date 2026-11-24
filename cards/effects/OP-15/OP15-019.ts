import type { CardScript } from '../../src/dsl.ts';

/** OP15-019 Barrier Bulls. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_019: CardScript = {
  cardId: 'OP15-019',
  textHash: '0b212679115b19',
  verified: {
    source: 'cards/overrides/OP15-019.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Draw 1 card and your Leader gains +1000 power until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'main',
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you' },
              amount: 1000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Give up to 1 of your opponent's Characters -4000 power",
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -4000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

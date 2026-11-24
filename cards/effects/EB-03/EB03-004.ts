import type { CardScript } from '../../src/dsl.ts';

/** EB03-004. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_004: CardScript = {
  cardId: 'EB03-004',
  textHash: '1795b7e8205b50',
  verified: {
    source: 'cards/overrides/EB03-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-turn-power',
      label:
        "Opponent's turn: if your Leader is multicolored and you have no Characters with 6000 base power or more, +4000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          leader: {
            multicolor: true,
          },
        },
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              basePower: {
                gte: 6000,
              },
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 4000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "you have no Characters with 6000 base power or more" counts this Character too (2000 base) and reads BASE power, so a boost never makes it false; the [Opponent\'s Turn] gate is `opponentsTurn`',
  ],
};

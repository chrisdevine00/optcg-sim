import type { CardScript } from '../../src/dsl.ts';

/** OP14-029 Tashigi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_029: CardScript = {
  cardId: 'OP14-029',
  textHash: '0d468a6f35a09e',
  verified: {
    source: 'cards/overrides/OP14-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Opponent's turn: instead of being removed by the opponent's effect, you may rest 1 of your cards",
      kind: 'replacement',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
    {
      id: 'boost',
      label:
        "You may rest 2 of your cards: this Character gains +2000 power until the end of your opponent's next End Phase",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 2000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "your cards" are the Leader, Characters, Stage and active cost-area DON!! (as OP15-035 Laboon); Tashigi may rest herself for either cost',
  ],
};

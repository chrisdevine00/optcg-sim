import type { CardScript } from '../../src/dsl.ts';

/** OP14-024 Kin'emon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_024: CardScript = {
  cardId: 'OP14-024',
  textHash: '03f97394bcf876',
  verified: {
    source: 'cards/overrides/OP14-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Set up to 3 of your DON!! as active; you cannot play Character cards during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 3,
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
                  category: ['Character'],
                },
              },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label: "Rest up to 1 of your opponent's cards",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters', 'stage', 'donCostArea'],
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, you cannot play" is not conditioned on the DON!! being set (no "If you do"); the restriction covers every Character play this turn, by effect too (M6b audit Q14 family); it also stops this Character\'s own turn plays after it',
    'reading (M6b-Q5): "your opponent\'s cards" are the Leader, Characters, Stage and active cost-area DON!! (as M4b E-Q3, Laboon); "up to 1" may rest nothing',
  ],
};

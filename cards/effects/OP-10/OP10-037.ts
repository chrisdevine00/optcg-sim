import type { CardScript } from '../../src/dsl.ts';

/** OP10-037 Lim. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_037: CardScript = {
  cardId: 'OP10-037',
  textHash: '1ecefad54872f7',
  verified: {
    source: 'cards/overrides/OP10-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'shield',
      label:
        "Once per turn: instead of this Character being removed by your opponent's effect, you may rest 1 of your {ODYSSEY} Characters",
      kind: 'replacement',
      oncePerTurn: true,
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
            from: 'characters',
            owner: 'you',
            filter: {
              type: 'ODYSSEY',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
    },
    {
      id: 'end-turn',
      label: 'End of your turn: set up to 1 of your {ODYSSEY} Characters as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                type: 'ODYSSEY',
              },
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
    'reading: the {ODYSSEY} Character rested instead is one the player could rest (an active one); it may be Lim herself, which also ends the removal (nothing is removed)',
  ],
};

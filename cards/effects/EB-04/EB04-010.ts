import type { CardScript } from '../../src/dsl.ts';

/** EB04-010 Lulucia Kingdom. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_010: CardScript = {
  cardId: 'EB04-010',
  textHash: '00bd88a410d4e4',
  verified: {
    source: 'cards/overrides/EB04-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-one-power',
      label: "[Opponent's Turn] All of your Characters with a base cost of 1 gain +5000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                baseCost: {
                  eq: 1,
                },
              },
            },
            amount: 5000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: "Set the power of up to 1 of your opponent's Characters to 0 during this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            setBasePower: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              value: 0,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q9): "Set the power to 0" is a base-power set on the power layer, so later +power this turn still adds; an official ruling that later buffs do not apply would change this',
    'reading: base cost 1 is the printed cost (a cost-reduced Character does not qualify, an increased one does not lose it); the buff covers Characters that arrive later and the Stage itself is not a Character',
  ],
};

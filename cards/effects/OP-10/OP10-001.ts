import type { CardScript } from '../../src/dsl.ts';

/** OP10-001 Smoker. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_001: CardScript = {
  cardId: 'OP10-001',
  textHash: '032ea612fa7983',
  verified: {
    source: 'cards/overrides/OP10-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-boost',
      label: "Opponent's Turn: your {Navy} or {Punk Hazard} Characters gain +1000 power",
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
                any: [
                  {
                    type: 'Navy',
                  },
                  {
                    type: 'Punk Hazard',
                  },
                ],
              },
            },
            amount: 1000,
          },
        },
      ],
    },
    {
      id: 'set-don',
      label: 'Once per turn: with a Character of 7000 power or more, set up to 2 DON!! as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            exists: {
              from: 'characters',
              owner: 'you',
              filter: {
                power: {
                  gte: 7000,
                },
              },
            },
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 2,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "If you have a Character with 7000 power or more" follows no colon, so it is an effect condition: the ability is used (Once Per Turn spent) and nothing happens without one',
    "reading: the 7000 is the Character's current power (given DON!! and buffs count on your turn)",
  ],
};

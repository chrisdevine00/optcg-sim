import type { CardScript } from '../../src/dsl.ts';

/** EB04-003 Smoker & Tashigi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_003: CardScript = {
  cardId: 'EB04-003',
  textHash: '085a1e3aeec507',
  verified: {
    source: 'cards/overrides/EB04-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Rush'],
  abilities: [
    {
      id: 'navy-base',
      label: "[Opponent's Turn] Your {Navy} type Leader's base power becomes 7000",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          setBasePower: {
            target: {
              from: 'leader',
              owner: 'you',
              filter: {
                type: 'Navy',
              },
            },
            value: 7000,
          },
        },
      ],
    },
  ],
  rulings: [
    'RL-33: several base-power effects, the highest applies (CR 4-9-2-1); "becomes 7000" can lower a Leader whose printed power is above 7000 (the effect sets the value)',
  ],
};

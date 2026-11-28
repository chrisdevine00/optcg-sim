import type { CardScript } from '../../src/dsl.ts';

/** OP18-027 Zoro & Sogeking. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_027: CardScript = {
  cardId: 'OP18-027',
  textHash: '1f72df94f9c690',
  verified: {
    source: 'cards/overrides/OP18-027.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'luffy-base',
      label:
        "Opponent's turn: the base power of your active [Monkey.D.Luffy] Leader with 3 or more DON!! given becomes 7000",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }],
      apply: [
        {
          setBasePower: {
            target: {
              from: 'leader',
              owner: 'you',
              filter: {
                all: [{ name: 'Monkey.D.Luffy' }, { state: 'active' }, { donGiven: { gte: 3 } }],
              },
            },
            value: 7000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "Set up to 2 DON!! as active; then up to 1 opponent's Character with a cost of 6 or less cannot be rested until the end of their next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 2 } } } },
        {
          do: {
            restrict: {
              target: {
                from: 'characters',
                owner: 'opponent',
                filter: { cost: { lte: 6 } },
                pick: { upTo: 1 },
              },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
};

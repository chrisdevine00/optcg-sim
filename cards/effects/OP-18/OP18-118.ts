import type { CardScript } from '../../src/dsl.ts';

/** OP18-118 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_118: CardScript = {
  cardId: 'OP18-118',
  textHash: '04f944d992f148',
  verified: {
    source: 'cards/overrides/OP18-118.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Set up to 3 DON!! as active; then up to 1 opponent's Character cannot be rested until the end of their next End Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 3 } } } },
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              what: 'cannotBeRested',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
    {
      id: 'end',
      label: 'Set up to 1 of your {Water Seven} type cards as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: ['leader', 'characters', 'stage'],
              owner: 'you',
              filter: { type: 'Water Seven' },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};

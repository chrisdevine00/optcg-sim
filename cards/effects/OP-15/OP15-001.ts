import type { CardScript } from '../../src/dsl.ts';

/** OP15-001 Krieg (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_001: CardScript = {
  cardId: 'OP15-001',
  textHash: '0695e6c19461b3',
  verified: {
    source: 'cards/overrides/OP15-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'east-blue-aura',
      label:
        "[DON!! x1] Opponent's turn: if the only Characters on your field are {East Blue} Characters, all of your opponent's Characters get -2000 power",
      kind: 'permanent',
      conditions: [
        { donGiven: 1 },
        { opponentsTurn: true },
        { exists: { from: 'characters', owner: 'you' } },
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: { not: { type: 'East Blue' } },
          },
        },
      ],
      apply: [
        {
          power: {
            target: { from: 'characters', owner: 'opponent' },
            amount: -2000,
          },
        },
      ],
    },
    {
      id: 'rest',
      label: "Rest up to 1 of your opponent's Characters that has 2 or more DON!! cards given",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { donGiven: { gte: 2 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "the only Characters on your field are {East Blue} type Characters" is false with no Characters (an `exists` plus a `none` of the non-East Blue); whether it needs at least one is the open "only" question of the OP-16 Leader (OP16-022)',
    "reading: the [DON!! x1] and [Opponent's Turn] are conditions of the permanent; the -2000 applies to every opposing Character while true and is re-evaluated continuously",
  ],
};

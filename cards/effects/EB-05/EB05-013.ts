import type { CardScript } from '../../src/dsl.ts';

/** EB05-013 Shirley. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_013: CardScript = {
  cardId: 'EB05-013',
  textHash: '00fe5d52270a60',
  verified: {
    source: 'cards/overrides/EB05-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        'You may rest 1 of your DON!! cards: your {Fish-Man} or {Merfolk} type Leader gains +2000 power during this battle',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  any: [
                    {
                      type: 'Fish-Man',
                    },
                    {
                      type: 'Merfolk',
                    },
                  ],
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'review EB05-R1: no "up to" in the text, so the Leader boost is mandatory (no pick: every matching Leader, i.e. yours)',
    'reading: the type check is on the target, so with a Leader of neither type the cost can still be paid and nothing happens (the printed text has no "if")',
  ],
};

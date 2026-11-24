import type { CardScript } from '../../src/dsl.ts';

/** OP14-090 Mr.1(Daz.Bonez). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_090: CardScript = {
  cardId: 'OP14-090',
  textHash: '0916dbce261cfd',
  verified: {
    source: 'cards/overrides/OP14-090.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush-character',
      label:
        'With a Character of cost 0 or 8+ on either field: can attack Characters on the turn it is played',
      kind: 'permanent',
      conditions: [
        {
          any: [
            { exists: { from: 'characters', owner: 'any', filter: { cost: { eq: 0 } } } },
            { exists: { from: 'characters', owner: 'any', filter: { cost: { gte: 8 } } } },
          ],
        },
      ],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Rush: Character' } }],
    },
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's cost 0 Characters",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { eq: 0 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};

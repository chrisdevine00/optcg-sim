import type { CardScript } from '../../src/dsl.ts';

/** OP18-047 Mr.1(Daz.Bonez). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_047: CardScript = {
  cardId: 'OP18-047',
  textHash: '170124ca71997b',
  verified: {
    source: 'cards/overrides/OP18-047.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your Leader with the {Cross Guild} type or a type including "Baroque Works" gains [Unblockable] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: { any: [{ type: 'Cross Guild' }, { typeIncludes: 'Baroque Works' }] },
              },
              keyword: 'Unblockable',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

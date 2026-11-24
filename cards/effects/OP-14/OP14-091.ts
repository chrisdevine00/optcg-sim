import type { CardScript } from '../../src/dsl.ts';

/** OP14-091 Mr.2.Bon.Kurei(Bentham). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_091: CardScript = {
  cardId: 'OP14-091',
  textHash: '0f4b94e7c942b8',
  verified: {
    source: 'cards/overrides/OP14-091.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Play up to 1 Baroque Works Character with a cost of 5 or less other than [Mr.2.Bon.Kurei(Bentham)] from your hand or trash',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: ['hand', 'trash'],
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { typeIncludes: 'Baroque Works' },
                    { cost: { lte: 5 } },
                    { not: { name: 'Mr.2.Bon.Kurei(Bentham)' } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};

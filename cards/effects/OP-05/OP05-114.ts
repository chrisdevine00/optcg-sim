import type { CardScript } from '../../src/dsl.ts';

/** OP05-114 El Thor. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP05_114: CardScript = {
  cardId: 'OP05-114',
  textHash: '080f2674fac3ba',
  verified: {
    source: 'cards/overrides/OP05-114.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Characters gains +2000 power during this battle; if your opponent has 2 or less Life, an additional +2000',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: { upTo: 1 },
                bind: 'boosted',
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          if: { cmp: [{ life: 'opponent' }, '<=', 2] },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: { ref: 'boosted' },
                  },
                  amount: 2000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with cost at most their Life count",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: { life: 'opponent' } } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};

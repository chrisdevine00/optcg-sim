import type { CardScript } from '../../src/dsl.ts';

/** OP16-105 Gecko Moria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_105: CardScript = {
  cardId: 'OP16-105',
  textHash: '149a37b9ce5a58',
  verified: {
    source: 'cards/overrides/OP16-105.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trigger',
      label:
        'With 1 or less Life, play up to 1 each of [Absalom], [Dr. Hogback] and [Perona] (cost 4 or less) from your trash',
      kind: 'trigger',
      effect: [
        {
          if: { cmp: [{ life: 'you' }, '<=', 1] },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: { all: [{ name: 'Absalom' }, { cost: { lte: 4 } }] },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: { all: [{ name: 'Dr. Hogback' }, { cost: { lte: 4 } }] },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: { all: [{ name: 'Perona' }, { cost: { lte: 4 } }] },
                    pick: { upTo: 1 },
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
    'reading: three independent "up to 1" plays, each may be declined; Life is counted as the Trigger resolves (after the damage that revealed it)',
  ],
};

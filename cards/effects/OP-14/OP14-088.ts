import type { CardScript } from '../../src/dsl.ts';

/** OP14-088 Miss.MerryChristmas(Drophy). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_088: CardScript = {
  cardId: 'OP14-088',
  textHash: '0b112f1233ccc2',
  verified: {
    source: 'cards/overrides/OP14-088.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "If your Leader is Baroque Works: draw 1 and K.O. up to 1 of your opponent's cost 1 Stages",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { leader: { typeIncludes: 'Baroque Works' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                ko: {
                  from: 'stage',
                  owner: 'opponent',
                  filter: { cost: { eq: 1 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

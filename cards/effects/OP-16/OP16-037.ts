import type { CardScript } from '../../src/dsl.ts';

/** OP16-037 Mr.3(Galdino). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_037: CardScript = {
  cardId: 'OP16-037',
  textHash: '12bc084abad3a9',
  verified: {
    source: 'cards/overrides/OP16-037.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the {Impel Down} type, rest up to 1 of your opponent's Characters with a cost of 5 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Impel Down',
            },
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 5,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

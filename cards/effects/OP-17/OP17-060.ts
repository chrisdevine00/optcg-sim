import type { CardScript } from '../../src/dsl.ts';

/** OP17-060 Ulti & Page One. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_060: CardScript = {
  cardId: 'OP17-060',
  textHash: '1001136ef873b9',
  verified: {
    source: 'cards/overrides/OP17-060.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Add up to 1 active DON!!; then K.O. up to 1 of your opponent's Characters with 3000 power or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Animal Kingdom Pirates',
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                ],
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    power: {
                      lte: 3000,
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

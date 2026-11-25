import type { CardScript } from '../../src/dsl.ts';

/** OP09-090 Doc Q. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_090: CardScript = {
  cardId: 'OP09-090',
  textHash: '17da454665a0bb',
  verified: {
    source: 'cards/overrides/OP09-090.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      kind: 'activate',
      when: 'activateMain',
      label:
        "Rest this Character: with a {Blackbeard Pirates} Leader, K.O. up to 1 of your opponent's Characters with a cost of 1 or less",
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              type: 'Blackbeard Pirates',
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 1,
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
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
};

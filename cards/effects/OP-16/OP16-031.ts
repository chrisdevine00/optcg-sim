import type { CardScript } from '../../src/dsl.ts';

/** OP16-031 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_031: CardScript = {
  cardId: 'OP16-031',
  textHash: '1066bc841c7aa2',
  verified: {
    source: 'cards/overrides/OP16-031.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Play up to 1 [Prisoner of Impel Down] from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  name: 'Prisoner of Impel Down',
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};

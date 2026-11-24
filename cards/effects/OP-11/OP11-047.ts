import type { CardScript } from '../../src/dsl.ts';

/** OP11-047 Vinsmoke Reiju. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_047: CardScript = {
  cardId: 'OP11-047',
  textHash: '093d00bd53d192',
  verified: {
    source: 'cards/overrides/OP11-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With a {The Vinsmoke Family} Leader: look at 5; reveal up to 1 card with a type including "GERMA" and add it to your hand; trash the rest',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'The Vinsmoke Family',
            },
          },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 5,
                  take: [
                    {
                      pick: {
                        upTo: 1,
                      },
                      filter: {
                        typeIncludes: 'GERMA',
                      },
                      reveal: true,
                      to: 'hand',
                    },
                  ],
                  rest: 'trash',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, trash the rest" is inside the Leader guard (a failed "If" does not resolve a "Then", M4b-5); the Leader type is an exact type, the searched type a substring (CR 2-4-3-1)',
  ],
};

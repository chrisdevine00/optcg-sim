import type { CardScript } from '../../src/dsl.ts';

/** OP13-067 Scopper Gaban. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_067: CardScript = {
  cardId: 'OP13-067',
  textHash: '129985dad3124b',
  verified: {
    source: 'cards/overrides/OP13-067.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With a {Roger Pirates} Leader: draw 2, trash 1 from your hand, then add up to 1 DON!! rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              typeIncludes: 'Roger Pirates',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is inside the "If"; the draw and the trash are mandatory (the drawn cards are candidates); "type includes" is `typeIncludes` on the Leader',
  ],
};

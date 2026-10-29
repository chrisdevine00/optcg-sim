import type { CardScript } from '../../src/dsl.ts';

/** OP17-073 Basil Hawkins. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_073: CardScript = {
  cardId: 'OP17-073',
  textHash: '1687e0e1f97957',
  verified: {
    source: 'cards/overrides/OP17-073.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 active DON!!',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
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
          ],
        },
      ],
    },
  ],
};

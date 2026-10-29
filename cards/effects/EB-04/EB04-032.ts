import type { CardScript } from '../../src/dsl.ts';

/** EB04-032 Queen. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_032: CardScript = {
  cardId: 'EB04-032',
  textHash: '1e5802bb7731e5',
  verified: {
    source: 'cards/overrides/EB04-032.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              type: 'Animal Kingdom Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
    {
      id: 'ramp',
      label: 'Add up to 1 rested DON!!',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          restDon: 2,
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
};

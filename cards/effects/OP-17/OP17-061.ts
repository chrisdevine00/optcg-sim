import type { CardScript } from '../../src/dsl.ts';

/** OP17-061 Lead Performers. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_061: CardScript = {
  cardId: 'OP17-061',
  textHash: '1aa38c3b62764b',
  verified: {
    source: 'cards/overrides/OP17-061.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Add up to 1 card from the top of your deck to the top of your Life',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
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
                move: {
                  what: {
                    from: 'deckTop',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'life',
                    position: 'top',
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'swap',
      label: 'Play up to 1 [King], [Queen] or [Jack] from your hand',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  any: [
                    {
                      name: 'King',
                    },
                    {
                      name: 'Queen',
                    },
                    {
                      name: 'Jack',
                    },
                  ],
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

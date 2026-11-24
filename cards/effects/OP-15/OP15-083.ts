import type { CardScript } from '../../src/dsl.ts';

/** OP15-083 Spoil. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_083: CardScript = {
  cardId: 'OP15-083',
  textHash: '09ea5e981c3c87',
  verified: {
    source: 'cards/overrides/OP15-083.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 3 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            mill: {
              player: 'you',
              n: 3,
            },
          },
        },
      ],
    },
    {
      id: 'give',
      label:
        'You may trash this Character: if you have 15 or more cards in your trash, give up to 1 rested DON!! to 1 of your Leader or Characters',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                trash: 'you',
              },
              '>=',
              15,
            ],
          },
          then: [
            {
              do: {
                giveDon: {
                  n: 1,
                  state: 'rested',
                  to: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: {
                      exactly: 1,
                    },
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

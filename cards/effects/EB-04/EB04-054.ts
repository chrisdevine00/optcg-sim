import type { CardScript } from '../../src/dsl.ts';

/** EB04-054 Bartholomew Kuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_054: CardScript = {
  cardId: 'EB04-054',
  textHash: '08dae1c59dc22f',
  verified: {
    source: 'cards/overrides/EB04-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'With 2 or less Life, add up to 1 card from the top of your deck to the top of your Life',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '<=',
              2,
            ],
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
      id: 'on-ko',
      label: "Add up to 1 card from the top of your opponent's Life to the owner's hand",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'lifeTop',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP13-104 Kouzuki Hiyori. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_104: CardScript = {
  cardId: 'OP13-104',
  textHash: '00f27591d0445f',
  verified: {
    source: 'cards/overrides/OP13-104.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        'Trash 1 from hand: if your Leader is multicolored, add up to 1 card from top of deck to top of Life',
      kind: 'auto',
      when: ['onKO'],
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
              multicolor: true,
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
  ],
};

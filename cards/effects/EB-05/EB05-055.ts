import type { CardScript } from '../../src/dsl.ts';

/** EB05-055 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_055: CardScript = {
  cardId: 'EB05-055',
  textHash: '0490683775d3ed',
  verified: {
    source: 'cards/overrides/EB05-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Your turn: if your Leader has the "Wisdom" attribute, add up to 1 card from the top of your deck to the top of your Life',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              attribute: 'Wisdom',
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
      id: 'trigger',
      label: 'Trash 1 card from your hand: if you have 2 or less Life cards, play this card',
      kind: 'trigger',
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
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
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

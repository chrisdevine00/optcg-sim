import type { CardScript } from '../../src/dsl.ts';

/** OP18-083 Saint Killingham (Black). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_083: CardScript = {
  cardId: 'OP18-083',
  textHash: '070cd25fb339e2',
  verified: {
    source: 'cards/overrides/OP18-083.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Play up to 1 [Sleeptids] from your trash',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  name: 'Sleeptids',
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
    {
      id: 'on-ko',
      label: 'You may trash 2 cards from your hand: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  isSelf: true,
                },
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
  rulings: [
    'reading: "[Sleeptids]" is a card named Sleeptids (OP18-093), played from the trash without paying its cost',
  ],
};

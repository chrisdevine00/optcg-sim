import type { CardScript } from '../../src/dsl.ts';

/** OP18-079 Spandam (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_079: CardScript = {
  cardId: 'OP18-079',
  textHash: '15f36619b064b6',
  verified: {
    source: 'cards/overrides/OP18-079.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'life',
      label:
        'You may rest 2 of your DON!! cards and this Leader and trash 1 card with a type including "CP" from your hand: add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 2,
        },
        {
          restSelf: true,
        },
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'CP',
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
  rulings: [
    'reading: no Once Per Turn on the text; resting the Leader as a cost limits it to once a turn in practice (it stays rested until the next Refresh Phase)',
    'reading: the card is added face-down to the top of Life, as the other "add from the top of your deck to Life" cards do (EB02-052)',
  ],
};

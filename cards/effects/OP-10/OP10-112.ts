import type { CardScript } from '../../src/dsl.ts';

/** OP10-112 Eustass"Captain"Kid. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_112: CardScript = {
  cardId: 'OP10-112',
  textHash: '0902a536dc75d7',
  verified: {
    source: 'cards/overrides/OP10-112.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may rest this Character: trash up to 1 card from the top of your opponent's Life cards",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          restSelf: true,
        },
      ],
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
                zone: 'trash',
              },
            },
          },
        },
      ],
    },
    {
      id: 'end-of-turn',
      label:
        'If your opponent has 2 or less Life cards, draw 1 card and trash 1 card from your hand',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'opponent',
              },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                draw: 1,
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
          ],
        },
      ],
    },
  ],
  rulings: [
    'G30: the Life card is trashed face up, not damage, no [Trigger]; "up to 1" is asked, the rest cost is paid first (a Character that is already rested cannot pay it)',
    'reading: [End of Your Turn] "If" has no colon, so it is an effect condition (B3A-R1): the ability fires either way and nothing happens with 3+ opposing Life; "draw 1 and trash 1" are both inside the guard and the trash is mandatory',
  ],
};

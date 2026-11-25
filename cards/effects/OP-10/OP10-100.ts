import type { CardScript } from '../../src/dsl.ts';

/** OP10-100 Inazuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_100: CardScript = {
  cardId: 'OP10-100',
  textHash: '0d7935173ad2c7',
  verified: {
    source: 'cards/overrides/OP10-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "[DON!! x1] Rest up to 1 of your opponent's Characters with a cost equal to or less than the total of your and your opponent's Life cards",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          donGiven: 1,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: {
                    life: 'both',
                  },
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'With a Revolutionary Army Leader and 5 or less Life cards in total, play this card',
      kind: 'trigger',
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Revolutionary Army',
                },
              },
              {
                cmp: [
                  {
                    life: 'both',
                  },
                  '<=',
                  5,
                ],
              },
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
  rulings: [
    'reading: the total is read when the effect resolves (Life of both players, this attack\'s damage not yet dealt); the [Trigger] "If" has no colon, so it is an effect condition: an activated [Trigger] whose "If" fails still resolves, and the card goes to the trash (an activated [Trigger] card is trashed after it resolves); only declining the [Trigger] puts the card in the hand (B3B-R6)',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** EB05-053 Charlotte Praline. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_053: CardScript = {
  cardId: 'EB05-053',
  textHash: '0082c80f493471',
  verified: {
    source: 'cards/overrides/EB05-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'If your opponent has 9 or more cards in hand, add up to 1 card from your hand to the top of your Life cards',
      kind: 'auto',
      when: ['whenAttacking'],
      oncePerTurn: true,
      conditions: [
        {
          cmp: [
            {
              hand: 'opponent',
            },
            '>=',
            9,
          ],
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
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
  rulings: [
    'Reading: the Life card is added face-down (no "face-up" in the text)',
    'Reading: the [Trigger] cost is optional ("You may") and is paid before the Life condition is read',
  ],
};

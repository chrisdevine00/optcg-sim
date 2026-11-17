import type { CardScript } from '../../src/dsl.ts';

/** OP06-115 You're the One Who Should Disappear.. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP06_115: CardScript = {
  cardId: 'OP06-115',
  textHash: '0803deb8176c69',
  verified: {
    source: 'cards/overrides/OP06-115.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: your Leader or a Character gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      costOptional: true,
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
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'With 0 Life, you may add the top card of your deck to your Life; then trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
              },
              '=',
              0,
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
    'Reading: the "Then, trash 1 card" clause is gated by the "If you have 0 Life cards" (CR 4-10-1); inside it, the trash happens even if the add was declined (CR 4-10-2)',
    'QA-OP11 OP11-102 (RL-42): the [Trigger] can put the only Life card back at 0',
  ],
};

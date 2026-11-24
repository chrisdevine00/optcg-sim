import type { CardScript } from '../../src/dsl.ts';

/** EB04-008 Distorted Future. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_008: CardScript = {
  cardId: 'EB04-008',
  textHash: '1215f4b6a99a41',
  verified: {
    source: 'cards/overrides/EB04-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "If you have 2 or less Life cards, give up to 1 of your opponent's Characters -3000 power",
      kind: 'activate',
      when: 'main',
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
                power: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  amount: -3000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the "If" follows [Main] with no colon, so it is an effect condition checked as the Event resolves: the Event is played (cost paid) and does nothing with 3 or more Life',
  ],
};

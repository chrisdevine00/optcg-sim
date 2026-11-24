import type { CardScript } from '../../src/dsl.ts';

/** EB04-015 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_015: CardScript = {
  cardId: 'EB04-015',
  textHash: '132e28fd05cc8d',
  verified: {
    source: 'cards/overrides/EB04-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label:
        'You may rest 1 of your cards: if your Leader has {Fish-Man} or {Merfolk}, play up to 1 green Character with cost 6 or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
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
              any: [
                {
                  type: 'Fish-Man',
                },
                {
                  type: 'Merfolk',
                },
              ],
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          category: ['Character'],
                        },
                        {
                          color: 'Green',
                        },
                        {
                          cost: {
                            lte: 6,
                          },
                        },
                      ],
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
      ],
    },
  ],
  rulings: [
    'reading: "rest 1 of your cards" is the Leader, a Character, the Stage or a cost-area DON!! (active ones only, CR 1-3-2-1); Jinbe is already off the field, so he cannot pay it; the cost is optional (CR 8-3-1-4); the play is an unguarded "up to 1" pick (hand is hidden, so it is asked even with no match)',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** EB03-029. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_029: CardScript = {
  cardId: 'EB03-029',
  textHash: '074c37145a3d4e',
  verified: {
    source: 'cards/overrides/EB03-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 4 DON!!: if your Leader is [Boa Hancock], play up to 1 {Amazon Lily} or {Kuja Pirates} Character with a cost of 6 or less from your hand',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 4,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Boa Hancock',
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
                          any: [
                            {
                              type: 'Amazon Lily',
                            },
                            {
                              type: 'Kuja Pirates',
                            },
                          ],
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
    {
      id: 'counter',
      label: 'Up to 1 of your [Boa Hancock] cards gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Boa Hancock',
                },
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
  ],
  rulings: [
    'reading: the DON!! rest is an optional cost (CR 8-3-1-4): declining it plays the Event with no effect; the "If your Leader" after the colon is a step condition',
  ],
};

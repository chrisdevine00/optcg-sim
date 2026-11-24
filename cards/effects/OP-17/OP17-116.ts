import type { CardScript } from '../../src/dsl.ts';

/** OP17-116 Fulgora. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_116: CardScript = {
  cardId: 'OP17-116',
  textHash: '08ef2eb6729cb6',
  verified: {
    source: 'cards/overrides/OP17-116.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: "You may rest 2 of your DON!! cards: K.O. up to 1 of your opponent's Stages",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 2 }],
      effect: [
        {
          do: {
            ko: { from: 'stage', owner: 'opponent', pick: { upTo: 1 } },
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'If you have 2 or more Characters with a [Trigger], up to 1 of your Leader or Characters gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: { hasTrigger: true },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    pick: { upTo: 1 },
                  },
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "If you have 2 or more Characters ..." is checked once when the [Counter] resolves; the +4000 is "up to 1" of the Leader or Characters',
    'reading: "a [Trigger]" is a printed [Trigger] effect (hasTrigger reads printed card data)',
    'G18: the Stage K.O. goes through the K.O. event, so "cannot be K.O.\'d" and K.O. replacements on the Stage apply',
  ],
};

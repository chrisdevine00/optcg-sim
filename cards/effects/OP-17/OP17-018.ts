import type { CardScript } from '../../src/dsl.ts';

/** OP17-018 The Power to Destroy the World. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_018: CardScript = {
  cardId: 'OP17-018',
  textHash: '11f5fed114e0d9',
  verified: {
    source: 'cards/overrides/OP17-018.json (card text in cards/data)',
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
        'If you have 2 or more Characters with 8000 base power or more, up to 1 of your Leader or Characters gains +4000 power during this battle',
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
                  filter: { basePower: { gte: 8000 } },
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
    'reading: "base power" is the printed power (a Character with 8000 only from an effect does not count)',
    'G18: the Stage K.O. goes through the K.O. event, so "cannot be K.O.\'d" and K.O. replacements on the Stage apply',
  ],
};

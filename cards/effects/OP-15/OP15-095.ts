import type { CardScript } from '../../src/dsl.ts';

/** OP15-095 Gum-Gum Storm. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_095: CardScript = {
  cardId: 'OP15-095',
  textHash: '1ba8cdecf41080',
  verified: {
    source: 'cards/overrides/OP15-095.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 1 of your DON!!: if you have 15 or more cards in your trash, up to 1 of your {Straw Hat Crew} Leader or Character cards gains +3000 power this turn',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [{ restDon: 1 }],
      effect: [
        {
          if: { cmp: [{ trash: 'you' }, '>=', 15] },
          then: [
            {
              do: {
                power: {
                  target: {
                    from: ['leader', 'characters'],
                    owner: 'you',
                    filter: { type: 'Straw Hat Crew' },
                    pick: { upTo: 1 },
                  },
                  amount: 3000,
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
      label:
        'If you have 15 or more cards in your trash, up to 1 of your Leader or Character cards gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: { cmp: [{ trash: 'you' }, '>=', 15] },
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
};

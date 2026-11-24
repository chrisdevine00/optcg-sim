import type { CardScript } from '../../src/dsl.ts';

/** OP16-020 If You're Coming with Me... Kiss Your Lives Goodbye!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_020: CardScript = {
  cardId: 'OP16-020',
  textHash: '05966021e5a8a9',
  verified: {
    source: 'cards/overrides/OP16-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may rest 1 DON!! and reveal 1 Character card with 8000 power from your hand: draw 1',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 1,
        },
        {
          reveal: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  power: {
                    eq: 8000,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
    {
      id: 'counter',
      label:
        'You may trash 1 card from your hand: up to 1 of your Leader or Character cards gains +3000 power during this battle',
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
  ],
};

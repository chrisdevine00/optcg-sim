import type { CardScript } from '../../src/dsl.ts';

/** OP17-076 Wo Ro Ro Ro Ro... I Think I've Sobered Up. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_076: CardScript = {
  cardId: 'OP17-076',
  textHash: '08932322690c07',
  verified: {
    source: 'cards/overrides/OP17-076.json (card text in cards/data)',
    date: '2026-10-28',
    note: '"Charactes" in the upstream text is a typo for "Characters"',
  },
  abilities: [
    {
      id: 'counter',
      costOptional: true,
      label: 'Up to 1 of your Leader or Characters gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
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
      label: 'Draw 2 cards',
      kind: 'trigger',
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
};

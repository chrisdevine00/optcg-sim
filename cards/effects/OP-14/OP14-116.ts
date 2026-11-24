import type { CardScript } from '../../src/dsl.ts';

/** OP14-116 Salamander. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_116: CardScript = {
  cardId: 'OP14-116',
  textHash: '0dd1715e36d1bf',
  verified: {
    source: 'cards/overrides/OP14-116.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label:
        'Up to 1 of your Leader or Characters gains +2000 power during this battle; then play up to 1 {Amazon Lily} or {Kuja Pirates} Character with a cost of 4 or less from your hand',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { any: [{ type: 'Amazon Lily' }, { type: 'Kuja Pirates' }] },
                    { cost: { lte: 4 } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
    { id: 'trigger', label: 'Draw 1 card', kind: 'trigger', effect: [{ do: { draw: 1 } }] },
  ],
};

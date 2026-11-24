import type { CardScript } from '../../src/dsl.ts';

/** OP15-110 Braham. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_110: CardScript = {
  cardId: 'OP15-110',
  textHash: '04268120f83884',
  verified: {
    source: 'cards/overrides/OP15-110.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'If your Leader has the {Shandian Warrior} type, add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { leader: { type: 'Shandian Warrior' } },
          then: [
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

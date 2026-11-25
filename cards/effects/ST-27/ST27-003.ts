import type { CardScript } from '../../src/dsl.ts';

/** ST27-003 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST27_003: CardScript = {
  cardId: 'ST27-003',
  textHash: '0efeec4869d2a9',
  keywords: ['Blocker'],
  verified: {
    source: 'cards/overrides/ST27-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Play up to 1 {Blackbeard Pirates} type Character card with a cost of 5 or less from your trash rested',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Blackbeard Pirates' },
                    { cost: { lte: 5 } },
                  ],
                },
                pick: { upTo: 1 },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [Blocker] comes from the override; the cost 5 boundary is inclusive and Kuzan (cost 6, in the trash after the K.O.) is not a candidate; the Character is played rested',
  ],
};

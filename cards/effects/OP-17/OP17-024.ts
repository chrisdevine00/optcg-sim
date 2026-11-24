import type { CardScript } from '../../src/dsl.ts';

/** OP17-024 Howling Gab. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_024: CardScript = {
  cardId: 'OP17-024',
  textHash: '0619857b720562',
  verified: {
    source: 'cards/overrides/OP17-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Banish'],
  abilities: [
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's Characters",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};

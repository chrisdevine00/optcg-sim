import type { CardScript } from '../../src/dsl.ts';

/** OP13-117 Gum-Gum Dawn Stamp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_117: CardScript = {
  cardId: 'OP13-117',
  textHash: '0db8005c412d18',
  verified: {
    source: 'cards/overrides/OP13-117.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: "Turn 1 Life face-up: K.O. up to 1 of opponent's Characters with base cost 6 or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          turnLifeFaceUp: 1,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                baseCost: {
                  lte: 6,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
};

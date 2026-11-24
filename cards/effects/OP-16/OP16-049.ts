import type { CardScript } from '../../src/dsl.ts';

/** OP16-049 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_049: CardScript = {
  cardId: 'OP16-049',
  textHash: '11158597725b7f',
  verified: {
    source: 'cards/overrides/OP16-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label: 'You may rest this Character: draw 1',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
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
  ],
};

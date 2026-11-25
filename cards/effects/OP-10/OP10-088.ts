import type { CardScript } from '../../src/dsl.ts';

/** OP10-088 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_088: CardScript = {
  cardId: 'OP10-088',
  textHash: '0065cb7cc25700',
  verified: {
    source: 'cards/overrides/OP10-088.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Rest this Character and 1 of your Dressrosa Leader or Stage: draw 1 card; then trash 2 cards from the top of your deck',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            filter: {
              type: 'Dressrosa',
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
        {
          do: {
            mill: {
              player: 'you',
              n: 2,
            },
          },
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP09-109 Jaguar.D.Saul. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_109: CardScript = {
  cardId: 'OP09-109',
  textHash: '06a23eb679a77e',
  verified: {
    source: 'cards/overrides/OP09-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'trigger',
      kind: 'trigger',
      label: 'If your Leader is [Nico Robin], play this card',
      effect: [
        {
          if: {
            leader: {
              name: 'Nico Robin',
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP16-115 Black Vortex. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_115: CardScript = {
  cardId: 'OP16-115',
  textHash: '1a44ea9db29575',
  verified: {
    source: 'cards/overrides/OP16-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'With a {Blackbeard Pirates} Leader, add up to 1 card with a [Trigger] other than [Black Vortex] from your trash to your hand',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { leader: { type: 'Blackbeard Pirates' } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: { all: [{ hasTrigger: true }, { not: { name: 'Black Vortex' } }] },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "Negate the effect of up to 1 of your opponent's Leader or Characters during this turn",
      kind: 'trigger',
      effect: [
        {
          do: {
            negate: {
              target: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

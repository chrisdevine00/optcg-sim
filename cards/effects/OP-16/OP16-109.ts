import type { CardScript } from '../../src/dsl.ts';

/** OP16-109 Doc Q. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_109: CardScript = {
  cardId: 'OP16-109',
  textHash: '14f7b36eedec94',
  verified: {
    source: 'cards/overrides/OP16-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "With a {Blackbeard Pirates} Leader: draw 1 and K.O. up to 2 of your opponent's Characters with a cost of 1 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { leader: { type: 'Blackbeard Pirates' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 1 } },
                  pick: { upTo: 2 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [On K.O.] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'onKO', of: 'self' } } }],
    },
  ],
};

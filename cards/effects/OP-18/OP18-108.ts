import type { CardScript } from '../../src/dsl.ts';

/** OP18-108 Funkfreed. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_108: CardScript = {
  cardId: 'OP18-108',
  textHash: '041b2b1cc529a1',
  verified: {
    source: 'cards/overrides/OP18-108.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 card with a type including "CP" from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { typeIncludes: 'CP' },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [{ do: { draw: 2 } }],
    },
    {
      id: 'boost',
      label:
        'You may rest this Character: up to 1 of your [Spandam] gains +1000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Spandam' },
                pick: { upTo: 1 },
              },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
};

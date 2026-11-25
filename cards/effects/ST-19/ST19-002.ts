import type { CardScript } from '../../src/dsl.ts';

/** ST19-002 Sengoku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST19_002: CardScript = {
  cardId: 'ST19-002',
  textHash: '180af830e91f49',
  verified: {
    source: 'cards/overrides/ST19-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may trash 2 black {Navy} cards from your hand: if your Leader has the {Navy} type, draw 3 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { all: [{ color: 'Black' }, { type: 'Navy' }] },
            pick: { exactly: 2 },
          },
        },
      ],
      effect: [{ if: { leader: { type: 'Navy' } }, then: [{ do: { draw: 3 } }] }],
    },
  ],
  rulings: [
    'reading: the "If" is after the cost colon, so it is an effect condition: the cost is paid first and with a non-{Navy} Leader nothing is drawn (the cards stay trashed)',
  ],
};

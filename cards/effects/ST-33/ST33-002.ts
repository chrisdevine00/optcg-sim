import type { CardScript } from '../../src/dsl.ts';

/** ST33-002 Sakazuki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST33_002: CardScript = {
  cardId: 'ST33-002',
  textHash: '0c011aa0d05fe7',
  verified: {
    source: 'cards/overrides/ST33-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'You may trash 1 card from your hand: if your opponent has 6 or more cards in hand, they trash 1',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          if: { cmp: [{ hand: 'opponent' }, '>=', 6] },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: { exactly: 1 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Play up to 1 {Navy} Character with cost 4 or less from your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [{ category: ['Character'] }, { type: 'Navy' }, { cost: { lte: 4 } }],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};

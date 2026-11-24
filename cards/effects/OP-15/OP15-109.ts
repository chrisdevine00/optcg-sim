import type { CardScript } from '../../src/dsl.ts';

/** OP15-109 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_109: CardScript = {
  cardId: 'OP15-109',
  textHash: '116f6b4e283f7c',
  verified: {
    source: 'cards/overrides/OP15-109.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may add 1 card from the top of your Life cards to your hand: if your Leader has the {Straw Hat Crew} type, add up to 1 card from the top of your deck to the top of your Life cards, then play up to 1 {Sky Island} Character card with a cost of 5 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ lifeToHand: { from: 'top', n: 1 } }],
      effect: [
        {
          if: { leader: { type: 'Straw Hat Crew' } },
          then: [
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { type: 'Sky Island' },
                        { cost: { lte: 5 } },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'M4b-5 / RD 121-122: the "Then" sits inside the leading "If", so a failed Leader check skips the play too',
  ],
};

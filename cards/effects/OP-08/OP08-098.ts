import type { CardScript } from '../../src/dsl.ts';

/** OP08-098 Kalgara (Leader). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP08_098: CardScript = {
  cardId: 'OP08-098',
  textHash: '17d62eb97e5606',
  verified: {
    source: 'cards/overrides/OP08-098.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'Play up to 1 {Shandian Warrior} Character from your hand with cost at most your DON!! count; if you do, add 1 Life card to your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [{ donGiven: 1 }],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Shandian Warrior' },
                    { cost: { lte: { donOnField: 'you' } } },
                  ],
                },
                pick: { upTo: 1 },
              },
            },
          },
          label: 'played',
        },
        {
          ifDid: 'played',
          then: [
            {
              do: {
                move: {
                  what: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } },
                  to: { zone: 'hand' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'RL-48 / QA-OP08 OP08-098: usable at 0 Life; the Character is played and the Life part does nothing',
    '"If you do" is true only when a Character was actually played (label on the play step); playing none adds no Life card',
    'The DON!! count is every DON!! on your field (cost area plus given), read when the card is chosen',
  ],
};

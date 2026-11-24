import type { CardScript } from '../../src/dsl.ts';

/** OP16-116 Zehahahahaha!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_116: CardScript = {
  cardId: 'OP16-116',
  textHash: '19e96b148b12de',
  verified: {
    source: 'cards/overrides/OP16-116.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "With 10 DON!!, play up to 1 [Marshall.D.Teach] from your hand; then add up to 1 of your opponent's Life cards to their hand",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '>=', 10] },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: { name: 'Marshall.D.Teach' },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
            {
              do: {
                move: {
                  what: { from: 'lifeTop', owner: 'opponent', pick: { upTo: 1 } },
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
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'trigger',
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
  ],
  rulings: [
    'reading (audit Q10, needs a Q&A check): "Then" sits inside the 10-DON!! if, so with fewer than 10 DON!! neither the play nor the Life step happens; the Life step does not need a Teach to have been played',
  ],
};

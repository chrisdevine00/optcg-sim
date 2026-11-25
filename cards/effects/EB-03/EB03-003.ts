import type { CardScript } from '../../src/dsl.ts';

/** EB03-003 Uta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_003: CardScript = {
  cardId: 'EB03-003',
  textHash: '0d843505bf71a1',
  verified: {
    source: 'cards/overrides/EB03-003.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Uta], draw 2 cards; then, play up to 1 Character with 6000 power or less and no base effect from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { name: 'Uta' } },
          then: [
            { do: { draw: 2 } },
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { power: { lte: 6000 } },
                        { hasBaseEffect: false },
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
    'reading: "Then" after an "If" that failed does not resolve (M4b-5), so the play is inside the guard: with another Leader nothing is drawn or played; the cards drawn may be played (the pick is made after the draw)',
  ],
};

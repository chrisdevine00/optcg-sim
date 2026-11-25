import type { CardScript } from '../../src/dsl.ts';

/** EB03-039 Ulti. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_039: CardScript = {
  cardId: 'EB03-039',
  textHash: '065b7f4b125da6',
  verified: {
    source: 'cards/overrides/EB03-039.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Animal Kingdom Pirates} type, draw 1 card and trash 1 card from your hand; then, play up to 1 Character with 6000 power or less and no base effect from your trash',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Animal Kingdom Pirates' } },
          then: [
            { do: { draw: 1 } },
            { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
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
    'reading: the whole sentence after the "If" is inside the guard; the card trashed from the hand is already in the trash when the play is chosen, so it may itself be played (a Character of 6000 power or less with no base effect); the hand always holds the card just drawn, so the trash is never asked of an empty hand',
  ],
};

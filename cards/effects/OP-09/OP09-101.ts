import type { CardScript } from '../../src/dsl.ts';

/** OP09-101 Kuzan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_101: CardScript = {
  cardId: 'OP09-101',
  textHash: '062030131f120a',
  verified: {
    source: 'cards/overrides/OP09-101.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Place 1 of your opponent's Characters with a cost of 3 or less at the top or bottom of your opponent's Life cards face-up: your opponent trashes 1 card from their hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { exists: { from: 'characters', owner: 'opponent', filter: { cost: { lte: 3 } } } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: { cost: { lte: 3 } },
                    pick: { exactly: 1 },
                    bind: 'placed',
                  },
                  to: { zone: 'life', position: 'topOrBottom', faceUp: true },
                },
              },
            },
            {
              if: { none: { from: 'characters', owner: 'opponent', filter: { ref: 'placed' } } },
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
      ],
    },
  ],
  rulings: [
    'reading (G61): the text has no "you may", so the placement is not an optional cost (the optional-cost check refuses an auto cost without "you may"); it is the first step of the effect, mandatory, guarded by a check that a Character of cost 3 or less exists (public) and, after the move, that the chosen Character has left the field (the cost form would refuse an unpayable placement): your opponent\'s Character of cost 3 or less goes to the top or bottom (your choice) of their Life face-up, and only if a Character was placed (none eligible, or its removal stopped by "cannot be removed by your opponent\'s effects") your opponent trashes 1 card from their hand',
    'reading: the opponent chooses the card to trash (exactly 1); with an empty hand nothing is trashed',
  ],
};

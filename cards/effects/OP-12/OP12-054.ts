import type { CardScript } from '../../src/dsl.ts';

/** OP12-054 Marshall.D.Teach. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_054: CardScript = {
  cardId: 'OP12-054',
  textHash: '1d9a516621bf2d',
  verified: {
    source: 'cards/overrides/OP12-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has the {The Seven Warlords of the Sea} type, return up to 1 Character with a cost of 1 or less other than this Character to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'The Seven Warlords of the Sea' } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: { all: [{ cost: { lte: 1 } }, { isSelf: false }] },
                    pick: { upTo: 1 },
                  },
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
    'Reading: "Return up to 1 Character" names no owner: a Character of either side with a current cost of 1 or less, never Teach himself',
  ],
};

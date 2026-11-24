import type { CardScript } from '../../src/dsl.ts';

/** OP15-020 Fire Fist. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_020: CardScript = {
  cardId: 'OP15-020',
  textHash: '1803a6c938a21d',
  verified: {
    source: 'cards/overrides/OP15-020.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Leader +3000; opposing Character -8000; you may trash 2 cards: K.O. up to 1 Character with 0 power or less',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: { target: { from: 'leader', owner: 'you' }, amount: 3000, duration: 'thisTurn' },
          },
        },
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
              amount: -8000,
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
        {
          if: { cmp: [{ hand: 'you' }, '>=', 2] },
          then: [
            {
              may: [
                { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
              ],
              label: 'trash',
            },
            {
              ifDid: 'trash',
              then: [
                {
                  do: {
                    ko: {
                      from: 'characters',
                      owner: 'opponent',
                      filter: { power: { lte: 0 } },
                      pick: { upTo: 1 },
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
    'reading: "Then, you may trash 2 cards" is a may step with "If you do" for the K.O.; with fewer than 2 cards in hand nothing can be trashed so the K.O. does not happen',
    'the K.O. target is chosen after the -8000, which reads current power: a Character at 8000 or less is at 0 or less (a Character can also be at 0 or less by other means)',
  ],
};

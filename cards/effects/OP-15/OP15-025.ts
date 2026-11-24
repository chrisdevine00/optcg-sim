import type { CardScript } from '../../src/dsl.ts';

/** OP15-025 Kuro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_025: CardScript = {
  cardId: 'OP15-025',
  textHash: '07cca57c93e9a8',
  verified: {
    source: 'cards/overrides/OP15-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "Give up to 2 DON!! cards from your opponent's cost area to 1 of your opponent's Characters; then at the end of this turn up to 1 rested Character with 3 or more DON!! given will not become active in your opponent's next Refresh Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'any',
              from: 'opponent',
              to: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
            },
          },
        },
        {
          delayed: { at: 'endOfThisTurn' },
          do: [
            {
              do: {
                skipRefresh: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { all: [{ state: 'rested' }, { donGiven: { gte: 3 } }] },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q44): the DON!! come from the opponent's cost area, active or rested, the giver picking the kind when both are there",
    'reading: "up to 1 rested Character" is the opponent\'s (the card says "your opponent\'s next Refresh Phase"; a Character of yours cannot refresh then anyway); rested and the DON!! count are read at the end of the turn, not when the On Play resolves',
    'reading: "Then, at the end of this turn" is not conditional on the DON!! being given',
  ],
};

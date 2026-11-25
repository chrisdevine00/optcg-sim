import type { CardScript } from '../../src/dsl.ts';

/** OP09-022 Lim. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_022: CardScript = {
  cardId: 'OP09-022',
  textHash: '180b1b6997a9ed',
  verified: {
    source: 'cards/overrides/OP09-022.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'played-rested',
      label: 'Your Character cards are played rested',
      kind: 'permanent',
      apply: [{ playRested: { category: ['Character'] } }],
    },
    {
      id: 'activate',
      label:
        'Once per turn, you may rest 3 of your DON!! cards: add up to 1 DON!! card from your DON!! deck and rest it, and play up to 1 {ODYSSEY} Character with a cost of 5 or less from your hand',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [{ restDon: 3 }],
      effect: [
        { do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [{ category: ['Character'] }, { type: 'ODYSSEY' }, { cost: { lte: 5 } }],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "and play" is a second step of the same effect, not conditional on the DON!! added (with an empty DON!! deck the play still happens); the Character played by the effect enters rested (the permanent applies to every play, M6b-Q74); the cost is the 3 DON!! rested, so the DON!! added by the effect is not available to pay it',
  ],
};

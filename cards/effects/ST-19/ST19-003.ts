import type { CardScript } from '../../src/dsl.ts';

/** ST19-003 Tashigi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST19_003: CardScript = {
  cardId: 'ST19-003',
  textHash: '0b544f7f7b4ad6',
  verified: {
    source: 'cards/overrides/ST19-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader is [Smoker], give up to 1 of your opponent's Characters -4 cost during this turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { name: 'Smoker' } },
          then: [
            {
              do: {
                cost: {
                  target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
                  amount: -4,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'activate',
      label:
        "If this Character was played on this turn, trash up to 1 of your opponent's Characters with a cost of 0",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: { self: { playedThisTurn: true } },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: { cost: { eq: 0 } },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'trash' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: both "If" clauses have no colon, so they are effect conditions (B3A-R1): the [Activate: Main] is always offered and spends Once Per Turn even when this Character was not played this turn',
    'reading: "cost of 0" is the current cost, so the -4 cost from the [On Play] (or any other reduction) makes a Character a legal target; the trash is not a K.O. (no [On K.O.])',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** ST27-001 Avalo Pizarro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST27_001: CardScript = {
  cardId: 'ST27-001',
  textHash: '01a7c09c25e2f9',
  verified: {
    source: 'cards/overrides/ST27-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'boost',
      label:
        'You may rest 1 of your [Fullalead] cards: if your Leader has {Blackbeard Pirates}, this Character gains +4000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          rest: {
            from: ['leader', 'characters', 'stage'],
            owner: 'you',
            filter: { name: 'Fullalead' },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [
        {
          if: { leader: { type: 'Blackbeard Pirates' } },
          then: [
            {
              do: {
                power: {
                  target: { from: 'self', owner: 'you' },
                  amount: 4000,
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'reading: the "If" follows the cost colon: with another Leader the [Fullalead] is rested, Once Per Turn is spent and nothing happens; only an active [Fullalead] can pay the cost',
  ],
};

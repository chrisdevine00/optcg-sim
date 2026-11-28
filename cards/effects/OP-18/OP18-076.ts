import type { CardScript } from '../../src/dsl.ts';

/** OP18-076 Shark Submerge 3. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_076: CardScript = {
  cardId: 'OP18-076',
  textHash: '1bdc818c31782e',
  verified: {
    source: 'cards/overrides/OP18-076.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 1 card, then add up to 1 DON!! card as rested from your DON!! deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { draw: 1 } }, { do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } }],
    },
    {
      id: 'opp-attack',
      label:
        'You may rest this Stage: your Leader with 5000 power or less and up to 2 of your Characters gain +1000 power during this turn',
      kind: 'auto',
      when: ['onOpponentAttack'],
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you', filter: { power: { lte: 5000 } } },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'you', pick: { upTo: 2 } },
              amount: 1000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader gains only while its power is 5000 or less when the effect resolves; the Characters are any 2 of yours (no power limit)',
  ],
};

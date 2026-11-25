import type { CardScript } from '../../src/dsl.ts';

/** EB03-033 Charlotte Brulee. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_033: CardScript = {
  cardId: 'EB03-033',
  textHash: '1e93966e17c7f8',
  verified: {
    source: 'cards/overrides/EB03-033.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'don-returned',
      label:
        'When a DON!! card on your field is returned to your DON!! deck by your effect, if your Leader has {Big Mom Pirates}, add up to 1 DON!! card from your DON!! deck and rest it',
      kind: 'auto',
      when: [{ event: 'donReturned', owner: 'you', cause: 'yourEffect' }],
      oncePerTurn: true,
      conditions: [{ opponentsTurn: true }],
      effect: [
        {
          if: { leader: { type: 'Big Mom Pirates' } },
          then: [{ do: { addDon: [{ n: 1, state: 'rested', upTo: true }] } }],
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q65): a DON!! -N cost is part of your effect (RL-16, Q31), so it fires this; the opponent making you return DON!! does not; the Leader type is an effect "if": the Once Per Turn is spent when it fails (colon-less If, DECISIONS 2026-11-24)',
  ],
};

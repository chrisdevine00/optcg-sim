import type { CardScript } from '../../src/dsl.ts';

/** OP16-100 Hallowed Glacier Slash. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_100: CardScript = {
  cardId: 'OP16-100',
  textHash: '0b737646cdb3d1',
  verified: {
    source: 'cards/overrides/OP16-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      costOptional: true,
      label:
        "You may rest 2 DON!!: if your opponent's Character was K.O.'d this turn, set your Leader [Yamato] as active",
      kind: 'activate',
      when: 'main',
      cost: [{ restDon: 2 }],
      effect: [
        {
          if: { koedThisTurn: 'opponent' },
          then: [
            { do: { setActive: { from: 'leader', owner: 'you', filter: { name: 'Yamato' } } } },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: { target: { from: 'leader', owner: 'you' }, amount: 3000, duration: 'battle' },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading (block 5 audit Q19): any K.O. of an opponent's Character earlier this turn counts, by battle or effect, whoever caused it",
  ],
};

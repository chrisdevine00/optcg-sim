import type { CardScript } from '../../src/dsl.ts';

/** OP17-067 Kurozumi Kanjuro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_067: CardScript = {
  cardId: 'OP17-067',
  textHash: '18623d04859fc0',
  verified: {
    source: 'cards/overrides/OP17-067.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "DON!! -1: with a Character of cost 10 or more, rest up to 1 of your opponent's Characters",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ donMinus: 1 }],
      effect: [
        {
          if: { exists: { from: 'characters', owner: 'you', filter: { cost: { gte: 10 } } } },
          then: [{ do: { rest: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: the Character condition is read after the DON!! -1 is paid (cost before the colon, "if" in the effect) and uses current cost, so Kanjuro himself (cost 2) never satisfies it',
  ],
};

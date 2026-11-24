import type { CardScript } from '../../src/dsl.ts';

/** OP15-003 Alvida. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_003: CardScript = {
  cardId: 'OP15-003',
  textHash: '1863a8a279ae4b',
  verified: {
    source: 'cards/overrides/OP15-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-shield',
      label: 'Trash 1 Character card with a power of 6000 or less from your hand instead',
      kind: 'replacement',
      replaces: { ko: { from: 'characters', owner: 'you', filter: { isSelf: true } } },
      optional: true,
      instead: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { all: [{ category: ['Character'] }, { power: { lte: 6000 } }] },
            pick: { exactly: 1 },
          },
        },
      ],
    },
    {
      id: 'give-don',
      label:
        "You may give 1 of your opponent's rested DON!! to 1 of their Characters: give up to 1 rested DON!! to their Leader or 1 of their Characters",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          giveDon: {
            n: 1,
            state: 'rested',
            from: 'opponent',
            to: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              from: 'opponent',
              to: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q24, Q44): \"its owner's\" DON!! is the opponent's own rested cost-area DON!!, given to the opponent's Leader or Characters; the cost needs a rested DON!! and an opposing Character, and the effect gives a second rested DON!! if one is left",
    'reading: the K.O. replacement protects Alvida only (this Character); the trashed Character card must have a printed power of 6000 or less',
  ],
};

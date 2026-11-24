import type { CardScript } from '../../src/dsl.ts';

/** OP17-105 Charlotte Chiffon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_105: CardScript = {
  cardId: 'OP17-105',
  textHash: '088f835b9aaf60',
  verified: {
    source: 'cards/overrides/OP17-105.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Trash 1 card with a [Trigger] from your hand: return up to 1 of your opponent's Characters with a [Trigger] to the owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: { from: 'hand', owner: 'you', filter: { hasTrigger: true }, pick: { exactly: 1 } },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: { hasTrigger: true },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: "a [Trigger]" is the printed [Trigger] line (hasTrigger), as for OP17-109'],
};

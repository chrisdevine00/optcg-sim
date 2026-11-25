import type { CardScript } from '../../src/dsl.ts';

/** ST15-002 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST15_002: CardScript = {
  cardId: 'ST15-002',
  textHash: '122224d10b30b4',
  verified: {
    source: 'cards/overrides/ST15-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Give up to 1 rested DON!! card to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        "Rest this Character: K.O. up to 1 of your opponent's Characters with 5000 power or less",
      kind: 'activate',
      when: 'activateMain',
      cost: [{ restSelf: true }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { power: { lte: 5000 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "5000 power or less" is the current power (DON!! given to it count on the opponent\'s side only on their turn, so on yours the printed power plus timed buffs)',
    'the give is "up to 1" DON!! with the Leader always a legal target (as ST17-004): the target is asked, no count',
  ],
};

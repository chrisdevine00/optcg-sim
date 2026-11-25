import type { CardScript } from '../../src/dsl.ts';

/** EB02-049 Monkey.D.Garp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_049: CardScript = {
  cardId: 'EB02-049',
  textHash: '00724ec56213d1',
  verified: {
    source: 'cards/overrides/EB02-049.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Give up to 2 rested DON!! cards to your Leader',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: {
                from: 'leader',
                owner: 'you',
                pick: {
                  exactly: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      id: 'activate',
      label:
        "You may rest this Character: if your Leader is [Monkey.D.Garp], K.O. up to 1 of your opponent's Characters with a cost of 1 or less",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Monkey.D.Garp',
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 1,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Read: "1 of your Leader" is the Leader (the only choice); "up to 2" asks a count when 2 or more DON!! are rested (as EB03-014)',
    'Read: the "If your Leader is [Monkey.D.Garp]" follows the colon, so the rest cost is paid and nothing happens with another Leader',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** EB04-021 Igaram. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_021: CardScript = {
  cardId: 'EB04-021',
  textHash: '16901761f324d1',
  verified: {
    source: 'cards/overrides/EB04-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'If your Leader is [Nefeltari Vivi], draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              name: 'Nefeltari Vivi',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'give-don',
      label:
        'You may trash 1 card from your hand: give up to 1 rested DON!! to your Leader or 1 of your Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
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
  ],
  rulings: [
    'reading: "Your Leader is [Nefeltari Vivi]" is the card name; the draw and the trash are two mandatory steps inside the If; as OP14-005 the give can be declined once activated (min-0 target pick)',
  ],
};

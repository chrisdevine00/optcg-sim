import type { CardScript } from '../../src/dsl.ts';

/** EB05-056 Nico Olvia. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_056: CardScript = {
  cardId: 'EB05-056',
  textHash: '1e6591fff096c7',
  verified: {
    source: 'cards/overrides/EB05-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 card with a [Trigger] from your hand: if your Leader is [Nico Robin], draw 2',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              hasTrigger: true,
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Nico Robin',
            },
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};

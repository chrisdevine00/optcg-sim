import type { CardScript } from '../../src/dsl.ts';

/** EB04-027 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_027: CardScript = {
  cardId: 'EB04-027',
  textHash: '0f0162a008369a',
  verified: {
    source: 'cards/overrides/EB04-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
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
    {
      id: 'trigger',
      label: 'Play up to 1 Character card with 5000 power or less and a [Trigger] from your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      power: {
                        lte: 5000,
                      },
                    },
                    {
                      hasTrigger: true,
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "power" in hand is the printed power; a Character with a [Trigger] and 0 power is eligible; the played Character\'s own [Trigger] is not activated (it is played, not revealed from Life)',
  ],
};

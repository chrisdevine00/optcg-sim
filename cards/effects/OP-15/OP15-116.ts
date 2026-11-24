import type { CardScript } from '../../src/dsl.ts';

/** OP15-116 Gum-Gum Golden Rifle. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_116: CardScript = {
  cardId: 'OP15-116',
  textHash: '110be2016e0fe2',
  verified: {
    source: 'cards/overrides/OP15-116.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'If your Leader has the {Straw Hat Crew} type, trash 1 card from the top of your Life cards; then add up to 1 card from the top of your deck to the top of your Life cards and trash 1 card from your hand',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { leader: { type: 'Straw Hat Crew' } },
          then: [
            {
              do: {
                move: {
                  what: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } },
                  to: { zone: 'trash' },
                },
              },
            },
            {
              do: {
                move: {
                  what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                  to: { zone: 'life', position: 'top' },
                },
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: { exactly: 1 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: { from: 'leader', owner: 'you' },
              amount: 4000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the whole Main is inside the Leader-type guard, including the "Then" (M4b-5: a Then after a false If does not resolve); with no Leader match nothing happens',
    'reading: "Then" is not "if you do": with an empty Life area the trash does nothing and the add and the hand trash still happen; the hand trash is mandatory (this Event is already in the trash, not in hand)',
    'reading: the Life trash is not damage (G30): no [Trigger], the card goes face up to the trash',
  ],
};

import type { CardScript } from '../../src/dsl.ts';

/** OP16-118 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_118: CardScript = {
  cardId: 'OP16-118',
  textHash: '1767f2da2ff1ef',
  verified: {
    source: 'cards/overrides/OP16-118.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'hand-counter',
      label: 'The Counter of your 8000-power Characters in hand becomes +2000',
      kind: 'permanent',
      apply: [
        {
          counter: {
            target: {
              from: 'hand',
              owner: 'you',
              filter: { all: [{ category: ['Character'] }, { power: { eq: 8000 } }] },
            },
            value: 2000,
          },
        },
      ],
    },
    {
      id: 'look',
      label:
        'Look at 5; reveal up to 1 [Monkey.D.Luffy] or {Whitebeard Pirates}-type card and add it to your hand',
      kind: 'auto',
      when: ['onPlay', 'onKO'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: {
                    any: [{ name: 'Monkey.D.Luffy' }, { typeIncludes: 'Whitebeard Pirates' }],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 1 [Luffy] or up to 1 card with a type including ..." is one card in total (the text adds "it")',
    'reading: a permanent of the Character on the field whose target is your hand; a Character card in hand with 8000 power gets a +2000 Counter (the highest applies, CR 2-10-4)',
  ],
};

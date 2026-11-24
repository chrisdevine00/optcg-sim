import type { CardScript } from '../../src/dsl.ts';

/** EB05-010 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_010: CardScript = {
  cardId: 'EB05-010',
  textHash: '049ccc9569fe37',
  verified: {
    source: 'cards/overrides/EB05-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-life',
      label:
        'When one of your Characters with the "Wisdom" attribute and without [Blocker] is K.O.\'d, add up to 1 card from the top of your deck to the top of your Life cards',
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'koed',
          filter: {
            all: [
              {
                attribute: 'Wisdom',
              },
              {
                not: {
                  keyword: 'Blocker',
                },
              },
            ],
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
      ],
    },
    {
      id: 'untap',
      label:
        'Set up to 1 of your Characters with the "Wisdom" attribute and 6000 power or less as active',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    attribute: 'Wisdom',
                  },
                  {
                    power: {
                      lte: 6000,
                    },
                  },
                ],
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
  rulings: [
    'Q14 (m6b-audit/block5): `koed` reads the K.O.\'d card with printed values, so a Character that has [Blocker] only from an effect still counts as "without [Blocker]" (OPEN-QUESTIONS M4b-2); accepted until last-known information is wired to this event',
    'reading: any K.O. (battle or effect) of your Wisdom Character fires it, once per turn',
  ],
};

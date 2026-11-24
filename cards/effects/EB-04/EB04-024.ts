import type { CardScript } from '../../src/dsl.ts';

/** EB04-024 Terracotta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_024: CardScript = {
  cardId: 'EB04-024',
  textHash: '12008342b60c93',
  verified: {
    source: 'cards/overrides/EB04-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'You may rest this Character and trash 1 card from your hand: up to 1 of your {Alabasta} Characters gains [Unblockable] during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
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
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  type: 'Alabasta',
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Unblockable',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: no Once Per Turn on the text, but the rest cost limits it to one use per untap; Terracotta (an {Alabasta}) may target herself even though she is rested by the cost',
  ],
};

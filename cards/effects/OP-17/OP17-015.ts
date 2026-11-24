import type { CardScript } from '../../src/dsl.ts';

/** OP17-015 Marco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_015: CardScript = {
  cardId: 'OP17-015',
  textHash: '0f036f1aefd983',
  verified: {
    source: 'cards/overrides/OP17-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-shield',
      label:
        "If one of your Characters would be removed from the field by your opponent's effect, you may K.O. this Character instead",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'you',
              filter: {
                isSelf: true,
              },
            },
          },
        },
      ],
    },
    {
      id: 'on-ko',
      label:
        'You may trash 1 card with a type including "Whitebeard Pirates" from your hand: play this Character card from your trash',
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              typeIncludes: 'Whitebeard Pirates',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
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

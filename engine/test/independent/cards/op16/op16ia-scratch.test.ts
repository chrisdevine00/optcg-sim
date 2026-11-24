import { it } from 'vitest';
import { decision, OL, OV, mine, choices, cardOf, useAbility, offeredAbilities, don } from './kit-op16a.ts';

const show = (tag: string, g: ReturnType<typeof mine>) =>
  console.log(
    tag,
    decision(g)?.kind,
    decision(g)?.purpose,
    decision(g)?.prompt,
    decision(g)?.min,
    decision(g)?.max,
    choices(g).map((c) => cardOf(g, c)),
    JSON.stringify(g.legal().map((a) => a.type)),
    JSON.stringify(decision(g)?.options),
  );

it('scratch', () => {
  for (const chars of [['OP11-064'], [], ['OP11-064', OV.sai4]]) {
    const g = mine(OL.impel, { characters: chars, costArea: { active: 3, rested: 7 } });
    console.log('abil', chars, offeredAbilities(g, g.leader('p1')));
    if (offeredAbilities(g, g.leader('p1')).length) {
      useAbility(g, g.leader('p1'));
      show('B', g);
      console.log(JSON.stringify(don(g, 'p1')));
    }
  }
});

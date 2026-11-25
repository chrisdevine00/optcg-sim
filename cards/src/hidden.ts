/**
 * Does an ability's script read a zone the other player cannot see (a hand, a deck top, a Life
 * card, cards looked at)? A typed walk of the DSL (M4a-17), not a pattern over its JSON: every
 * node kind is handled in an exhaustive switch, so a new DSL shape is a compile error here until
 * it is classified. Card text is public, so this is public information.
 *
 * Deliberately conservative: moving cards into a hand, deck or Life also counts (Use then shows
 * the hand first, which is harmless). Numeric reads such as `{ hand: 'you' }` are public counts
 * and do not count.
 */
import type {
  Ability,
  Action,
  AutoTiming,
  Condition,
  Continuous,
  Cost,
  Effect,
  Num,
  ReplaceEvent,
  Selector,
  Step,
  Zone,
} from './dsl.ts';
import { isEffect } from './dsl-validate.ts';

const HIDDEN: ReadonlySet<Zone> = new Set<Zone>([
  'hand',
  'deckTop',
  'lifeTop',
  'lifeTopOrBottom',
  'looked',
]);

function selector(s: Selector): boolean {
  const zones = Array.isArray(s.from) ? s.from : [s.from];
  return zones.some((z) => HIDDEN.has(z));
}

function sel(s: Selector | string | undefined): boolean {
  return typeof s === 'object' && s !== null && selector(s);
}

function num(n: Num): boolean {
  if (typeof n === 'number') return false;
  if ('count' in n) return selector(n.count);
  if ('sum' in n) return n.sum.some(num);
  if ('mul' in n) return num(n.mul[0]);
  if ('div' in n) return num(n.div[0]);
  // The Leader's or this card's stat, and the costs of cards on the field: all public (G67).
  if ('totalCost' in n) return selector(n.totalCost);
  if ('statOf' in n) return selector(n.statOf);
  return false; // public counts and stats (and the number of cards an event moved)
}

function condition(c: Condition): boolean {
  if ('exists' in c) return selector(c.exists);
  if ('none' in c) return selector(c.none);
  if ('cmp' in c) return num(c.cmp[0]) || num(c.cmp[2]);
  if ('all' in c) return c.all.some(condition);
  if ('any' in c) return c.any.some(condition);
  if ('not' in c) return condition(c.not);
  return false;
}

function cost(k: Cost): boolean {
  if ('trash' in k) return selector(k.trash);
  if ('reveal' in k) return true;
  if ('rest' in k) return selector(k.rest);
  if ('ko' in k) return selector(k.ko); // your own Characters: public
  // A power change on your Leader reads nothing hidden (G62).
  if ('power' in k) return selector(k.power.target);
  if ('move' in k) return selector(k.move) || destHidden(k.to.zone);
  if ('oneOf' in k) return k.oneOf.some((a) => a.some(cost));
  // lifeToHand, mill, turnLifeFaceDown, giveDon, returnDon: no hidden card is read; a Life card
  // turned face-down is hidden from then on, not read. trashLife (G30) takes the top Life card
  // whatever it is and shows it face up in the trash: whether it can be paid is the Life count.
  return false;
}

const destHidden = (z: string): boolean => z === 'hand' || z === 'deck' || z === 'life';

function action(a: Action): boolean {
  if ('draw' in a) return false; // the drawn card goes to the drawer alone
  if ('trashFromHand' in a) return true;
  if ('mill' in a) return false; // trashed face up
  if ('lookAtTop' in a) return true;
  if ('reveal' in a) return true;
  // Only a number the controller names, told to both players (G44).
  if ('chooseNumber' in a) return false;
  if ('trashLifeUntil' in a) return false; // trashed face up
  // Turns the face-up cards of your own Life face-down: reads no hidden card, and what it hides
  // was public (G41).
  if ('turnLifeFaceDown' in a) return false;
  // Damage takes the top Life card without reading it; what the damaged player does with a
  // [Trigger] is their own decision (G36). Winning the game reads nothing (G35).
  if ('damage' in a) return num(a.damage.n);
  if ('winGame' in a) return false;
  if ('swapBasePower' in a) return selector(a.swapBasePower.a) || selector(a.swapBasePower.b);
  if ('canAttackActive' in a) return selector(a.canAttackActive.target);
  if ('addReplacement' in a) return replacementReads(a.addReplacement);
  // Looks at Life cards no one else can see (G64).
  if ('lookAtLife' in a) return true;
  // DON!! given to Leaders and Characters, and the target of an attack: all on the board (G65, D3).
  if ('moveDon' in a) return selector(a.moveDon.from) || selector(a.moveDon.to);
  if ('redirectAttack' in a) return selector(a.redirectAttack.to);
  if ('move' in a) return selector(a.move.what) || destHidden(a.move.to.zone);
  if ('play' in a) return selector(a.play.what);
  if ('ko' in a) return selector(a.ko);
  if ('rest' in a) return selector(a.rest);
  if ('setActive' in a) return selector(a.setActive);
  if ('skipRefresh' in a) return selector(a.skipRefresh);
  if ('power' in a) return selector(a.power.target) || num(a.power.amount);
  if ('setBasePower' in a) return selector(a.setBasePower.target) || num(a.setBasePower.value);
  if ('cost' in a) return selector(a.cost.target) || num(a.cost.amount);
  if ('playCost' in a) return a.playCost.from === 'hand';
  if ('giveDon' in a) return selector(a.giveDon.to) || num(a.giveDon.n);
  if ('addDon' in a) return false;
  if ('returnDon' in a) return typeof a.returnDon.n !== 'string' && num(a.returnDon.n);
  if ('grant' in a) return selector(a.grant.target);
  if ('negate' in a) return selector(a.negate.target);
  if ('restrict' in a) return sel(a.restrict.target);
  if ('activate' in a) return false;
  if ('select' in a) return selector(a.select);
  return assertNever(a);
}

function step(s: Step): boolean {
  if ('if' in s) return condition(s.if) || effect(s.then) || effect(s.else ?? []);
  if ('may' in s) return effect(s.may);
  if ('ifDid' in s) return effect(s.then);
  if ('chooseOne' in s) return s.chooseOne.some(effect);
  if ('forEach' in s) return num(s.forEach) || effect(s.do);
  if ('delayed' in s) return effect(s.do);
  if ('do' in s) return action(s.do);
  return assertNever(s);
}

function effect(e: Effect): boolean {
  return e.some(step);
}

function continuous(c: Continuous): boolean {
  if ('power' in c) return selector(c.power.target) || num(c.power.amount);
  if ('setBasePower' in c) return selector(c.setBasePower.target) || num(c.setBasePower.value);
  if ('cost' in c) return selector(c.cost.target) || num(c.cost.amount);
  if ('playCost' in c) return selector(c.playCost.target) || num(c.playCost.amount);
  if ('counter' in c) return selector(c.counter.target);
  if ('grant' in c) return selector(c.grant.target);
  if ('restrict' in c) return sel(c.restrict.target);
  if ('lockAttackTarget' in c) return selector(c.lockAttackTarget.only);
  // A filter on the card being played reads its printed values, no hidden zone (G50).
  if ('playRested' in c) return false;
  // Names cards on the field by printed values (G66).
  if ('negate' in c) return selector(c.negate.target);
  if ('tiers' in c) return c.tiers.some((t) => condition(t.when) || t.apply.some(continuous));
  return assertNever(c);
}

function timing(t: AutoTiming): boolean {
  if (typeof t === 'string') return false;
  if (t.event === 'attack')
    return (!!t.attacker && selector(t.attacker)) || (!!t.target && selector(t.target));
  return false;
}

function assertNever(x: never): never {
  throw new Error(`readsHiddenZone: unclassified DSL node ${JSON.stringify(x)}`);
}

export function abilityReadsHiddenZone(ab: Ability): boolean {
  if ((ab.conditions ?? []).some(condition)) return true;
  switch (ab.kind) {
    case 'auto':
      return ab.when.some(timing) || (ab.cost ?? []).some(cost) || effect(ab.effect);
    case 'activate':
      return (ab.cost ?? []).some(cost) || effect(ab.effect);
    case 'trigger':
      return (ab.cost ?? []).some(cost) || effect(ab.effect);
    case 'permanent':
      return ab.apply.some(continuous);
    case 'replacement':
      return replacementReads(ab);
  }
}

/** The selectors a replaced event names, and the payload that takes its place. */
function replacementReads(r: {
  replaces: ReplaceEvent | ReplaceEvent[];
  instead: Cost[] | Effect;
}): boolean {
  const events = Array.isArray(r.replaces) ? r.replaces : [r.replaces];
  const named = events.some((e) =>
    'damage' in e
      ? false
      : 'ko' in e
        ? selector(e.ko)
        : 'leaveField' in e
          ? selector(e.leaveField)
          : selector(e.rest),
  );
  return (
    named || (isEffect(r.instead) ? effect(r.instead as Effect) : (r.instead as Cost[]).some(cost))
  );
}

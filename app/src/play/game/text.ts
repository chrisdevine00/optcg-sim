/**
 * Words for the game log, the live region and accessible names (board.md §3.11, accessibility.md
 * §9.1, §9.3). Everything here reads projected events and views only, so nothing hidden can reach a
 * string (the announcer leak rule, accessibility §9.3).
 */
import type { Card } from '@optcg/cards';
import type { GameEvent, PlayerId, PlayerView, ViewCard } from '@optcg/engine';

export const MINUS = '−';
export const num = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : String(n).replace('-', MINUS);

export type CardMap = ReadonlyMap<string, Card>;

export interface Names {
  /** The player the screen belongs to ("you"). */
  me: PlayerId;
  /** Display names; in a game against the AI, the opponent is its Leader's name. */
  player: Record<PlayerId, string>;
  hotseat: boolean;
}

export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export function cardName(cards: CardMap, id: string | null | undefined): string {
  if (!id) return 'a card';
  return cards.get(id)?.name ?? id;
}

/** "You" / "Opp" for the actor tag; player names in hotseat. */
export function tag(names: Names, p: PlayerId): string {
  if (names.hotseat) return names.player[p];
  return p === names.me ? 'You' : 'Opp';
}

export function whose(names: Names, p: PlayerId, capital = false): string {
  if (names.hotseat) return `${names.player[p]}’s`;
  if (p === names.me) return capital ? 'Your' : 'your';
  return capital ? 'Their' : 'their';
}

export interface LogLine {
  kind: 'turn' | 'move';
  actor: PlayerId | null;
  text: string;
  /** Card ids linked in the line, for hover highlighting and the inspector. */
  cards: string[];
  auto: boolean;
  /** First action index of the move (for "rewind to here"). */
  index: number;
}

interface Ctx {
  cards: CardMap;
  names: Names;
  life: Record<PlayerId, number>;
}

const lifeDelta = (ctx: Ctx, p: PlayerId, d: number): string => {
  const before = ctx.life[p];
  ctx.life[p] = Math.max(0, before + d);
  return `${whose(ctx.names, p)} Life ${before} → ${ctx.life[p]}`;
};

/**
 * Turn one move's projected events into log lines (one per move, plus turn headers). `life` is
 * the running Life count, updated in place.
 */
export function describeMove(
  events: readonly GameEvent[],
  actor: PlayerId,
  ctx: Ctx,
  index: number,
  auto: boolean,
): LogLine[] {
  const out: LogLine[] = [];
  let bits: string[] = [];
  let linked: string[] = [];
  let lineActor: PlayerId | null = actor;
  const flush = () => {
    if (bits.length)
      out.push({
        kind: 'move',
        actor: lineActor,
        text: bits.join(' · '),
        cards: linked,
        auto,
        index,
      });
    bits = [];
    linked = [];
  };
  const name = (id: unknown) => {
    const s = typeof id === 'string' ? id : null;
    if (s) linked.push(s);
    return cardName(ctx.cards, s);
  };
  const donGiven = new Map<string, number>();
  let drew = 0;
  let drewNames: string[] = [];
  let donPlaced = 0;
  let turnPlayer: PlayerId | null = null;
  for (const e of events) {
    const p = e.player as PlayerId | undefined;
    switch (e.type) {
      case 'FirstPlayerChosen':
        bits.push(
          `${tag(ctx.names, e.chooser as PlayerId)} chose to go ${e.first === e.chooser ? 'first' : 'second'}`,
        );
        lineActor = e.chooser as PlayerId;
        break;
      case 'Mulligan':
        bits.push(e.redraw ? 'Redrew the opening hand' : 'Kept the opening hand');
        break;
      case 'LifePlaced':
        ctx.life[p!] = Number(e.count);
        break;
      case 'TurnEnded':
        bits.push('End of turn');
        flush();
        break;
      case 'TurnStarted':
        flush();
        out.push({
          kind: 'turn',
          actor: p ?? null,
          text: `Turn ${String(e.turn)} · ${tag(ctx.names, p!)}`,
          cards: [],
          auto: false,
          index,
        });
        lineActor = p ?? null;
        turnPlayer = p ?? null;
        break;
      case 'CardMoved': {
        const from = e.from;
        const to = e.to;
        if (from === 'deck' && to === 'hand' && turnPlayer !== null && e.owner === turnPlayer) {
          drew++;
          if (typeof e.card === 'string') drewNames.push(name(e.card));
        } else if (from === 'life') {
          const owner = e.owner as PlayerId;
          if (to === 'hand')
            bits.push(
              `Life card to hand${typeof e.card === 'string' ? `: ${name(e.card)}` : ''} · ${lifeDelta(ctx, owner, -1)}`,
            );
          else bits.push(`Life card trashed · ${lifeDelta(ctx, owner, -1)}`);
          lineActor = owner;
        } else if (to === 'life') {
          ctx.life[e.owner as PlayerId] += 1;
        } else if (from === 'characters' && to === 'trash' && e.reason !== 'ko') {
          // Trashed to make room (CR 3-7-6-1) or by a rule; K.O.s have their own line.
        }
        break;
      }
      case 'DonPlaced':
        donPlaced += Number(e.count);
        break;
      case 'PhaseChanged':
        if (e.phase === 'main' && (drew || donPlaced)) {
          const parts = ['Refresh'];
          parts.push(
            drew
              ? `Draw${drewNames.length ? `: ${drewNames.join(', ')}` : ' 1'}`
              : 'No draw on turn 1',
          );
          parts.push(`DON!! +${donPlaced}`);
          bits.push(parts.join(' · '));
          drew = 0;
          drewNames = [];
          donPlaced = 0;
          flush();
        }
        break;
      case 'CardPlayed':
        bits.push(`Play ${name(e.card)}`);
        break;
      case 'DonRested':
        if (bits.length && bits.at(-1)!.startsWith('Play '))
          bits[bits.length - 1] += ` · ${String(e.count)} DON!!`;
        break;
      case 'DonGiven': {
        const k = String(e.card);
        donGiven.set(k, (donGiven.get(k) ?? 0) + Number(e.count));
        break;
      }
      case 'AttackDeclared':
        bits.push(
          `${name(e.card)} attacks ${e.targetCard && typeof e.targetCard === 'string' ? targetWords(ctx, e) : 'a card'}`,
        );
        break;
      case 'BlockerActivated':
        bits.push(`Block: ${name(e.card)}`);
        lineActor = p ?? lineActor;
        break;
      case 'NoBlock':
        break;
      case 'CounterPlayed':
        bits.push(`Counter: ${name(e.card)} +${String(e.amount)}`);
        lineActor = p ?? lineActor;
        break;
      case 'DamageStep': {
        const ap = num(Number(e.attackerPower));
        const tp = num(Number(e.targetPower));
        if (!e.attackerWins) bits.push(`Attack fails · ${ap} vs ${tp}`);
        else bits.push(`Hit · ${ap} vs ${tp}${ap === tp ? ' · ties go to the attacker' : ''}`);
        break;
      }
      case 'DamageDealt':
        if (Number(e.amount) > 1) bits.push(`${String(e.amount)} damage`);
        break;
      case 'KO':
        bits.push(`K.O. · ${whose(ctx.names, e.owner as PlayerId, true)} ${name(e.card)}`);
        break;
      case 'TriggerRevealed':
        bits.push(`Trigger: ${name(e.card)}`);
        break;
      case 'Conceded':
        bits.push('Conceded');
        lineActor = p ?? lineActor;
        break;
      case 'GameEnded': {
        flush();
        const r = e.result as { winner?: PlayerId; reason?: string; draw?: string };
        out.push({
          kind: 'move',
          actor: null,
          text: r.winner ? `Game over · ${winnerWords(ctx.names, r.winner)}` : 'Game over · draw',
          cards: [],
          auto: false,
          index,
        });
        break;
      }
      default:
        break;
    }
  }
  for (const [card, n] of donGiven) {
    linked.push(card);
    bits.unshift(`Give ${n} DON!! to ${cardName(ctx.cards, card)}`);
  }
  flush();
  return out;
}

function targetWords(ctx: Ctx, e: GameEvent): string {
  // AttackDeclared carries the target's card id; Leaders are named by role.
  const card = ctx.cards.get(String(e.targetCard));
  const owner: PlayerId = e.player === 'p1' ? 'p2' : 'p1';
  if (card?.category === 'Leader') return `${whose(ctx.names, owner)} Leader`;
  return `${whose(ctx.names, owner)} ${card?.name ?? 'Character'}`;
}

export function winnerWords(names: Names, winner: PlayerId): string {
  if (names.hotseat) return `${names.player[winner]} wins`;
  return winner === names.me ? 'You win' : `${names.player[winner]} wins`;
}

export function resultReason(reason: string | undefined, winner: PlayerId, names: Names): string {
  const loser = other(winner);
  const who = names.hotseat ? names.player[loser] + '’s' : loser === names.me ? 'Your' : 'Their';
  switch (reason) {
    case 'deck out':
      return `${who} deck ran out (CR 9-2-1-2).`;
    case 'concede':
      return names.hotseat
        ? `${names.player[loser]} conceded.`
        : loser === names.me
          ? 'You conceded.'
          : 'Your opponent conceded.';
    default:
      return `${who} Leader was hit at 0 Life (CR 9-2-1-1).`;
  }
}

// ---------------------------------------------------------------------------------------------
// Accessible names (accessibility.md §9.1)
// ---------------------------------------------------------------------------------------------

const KEYWORD_WORDS: Record<string, string> = {
  Blocker: 'Blocker',
  Rush: 'Rush',
  'Rush: Character': 'Rush: Character',
  'Double Attack': 'Double Attack',
  Banish: 'Banish',
  Unblockable: 'Unblockable',
};

export function cardAccessibleName(
  c: ViewCard,
  opts: {
    cards: CardMap;
    owner: string;
    zone: 'leader' | 'characters' | 'stage' | 'hand' | 'trash';
    ownersTurn: boolean;
    extra?: string[];
  },
): string {
  const card = c.card ? opts.cards.get(c.card) : undefined;
  const nm = card?.name ?? 'Face-down card';
  const bits: string[] = [];
  bits.push(opts.zone === 'leader' ? `${opts.owner} Leader, ${nm}` : `${opts.owner} ${nm}`);
  if (opts.zone === 'hand') {
    if (card) bits.push(card.category === 'Event' ? 'Event' : card.category);
    if (c.cost !== null) bits.push(`cost ${c.cost}`);
    if (card?.counter) bits.push(`Counter +${card.counter}`);
    if (c.power !== null && card?.category !== 'Event') bits.push(`${num(c.power)} power`);
  } else {
    if (opts.zone !== 'trash') bits.push(c.rested ? 'rested' : 'active');
    if (c.power !== null) bits.push(`${num(c.power)} power`);
    if (c.don > 0)
      bits.push(`${c.don} DON!!${opts.ownersTurn ? '' : ' (no bonus on the opponent’s turn)'}`);
    if (c.cost !== null && opts.zone === 'characters') bits.push(`cost ${c.cost}`);
  }
  const kws = c.keywords.filter((k) => KEYWORD_WORDS[k]);
  if (kws.length) bits.push(kws.join(', '));
  if (card?.triggerText) bits.push('Trigger');
  return [...bits, ...(opts.extra ?? [])].join(', ');
}

/** The status summary for `Q` (accessibility §9.2). */
export function statusSummary(view: PlayerView, names: Names, phaseWords: string): string {
  const me = view.player;
  const op = other(me);
  const side = (p: PlayerId) => {
    const z = view.zones[p];
    const d = view.don[p];
    const rested = z.characters.filter((c) => c.rested).length;
    return `${z.life.length} Life, ${z.hand.length} cards in hand, ${d.active} of ${d.active + d.rested + d.given} DON!! active, ${z.characters.length} Characters${rested ? `, ${rested} rested` : ''}`;
  };
  const who = names.hotseat ? names.player[op] : 'Opponent';
  return `Turn ${view.turn.number}, ${phaseWords}. You: ${side(me)}. ${who}: ${side(op)}.`;
}

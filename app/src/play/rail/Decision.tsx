/**
 * The decision panel (board.md §3.9–§3.10, flows F3–F8, F15, F21): the single home for "what am I
 * deciding". Header names the decision; the body holds its context and choices (the battle panel
 * during a battle); the footer holds a secondary button and the primary at fixed coordinates.
 * It goes tall for Block, Counter, Trigger, the attack confirm, a battle in progress and picks.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import type { Action, PlayerId } from '@optcg/engine';
import { SPEEDS, speedLabel } from '../game/controller.ts';
import { newIntentId, type Simulation } from '../../session/index.ts';
import { num, other, resultReason, winnerWords } from '../game/text.ts';
import type { G, Staging } from '../game/ui.ts';

export function isTall(g: G): boolean {
  const k = g.view.decision?.kind;
  if (g.view.result) return false;
  if (
    g.mine &&
    (k === 'mulligan' ||
      k === 'block' ||
      k === 'counter' ||
      k === 'trigger' ||
      k === 'choose' ||
      k === 'order' ||
      k === 'optional')
  )
    return true;
  if (g.ui.kind === 'confirm') return true;
  if (g.view.battle) return true;
  return false;
}

interface FootBtn {
  label: string;
  sub?: string | undefined;
  key?: string;
  onClick?: () => void;
  disabled?: boolean;
  reason?: string | undefined;
  tone?: string;
  id?: string;
  /** Focus lands here when the decision arrives (accessibility §3.2). */
  autoFocus?: boolean;
}
interface Foot {
  primary?: FootBtn;
  secondary?: FootBtn;
  /** Two equal buttons (Trigger, mulligan, first or second). */
  equal?: boolean;
}

export function DecisionPanel({
  g,
  top,
  parts,
  focusSignal,
}: {
  g: G;
  top: number;
  parts: [number, number, number];
  focusSignal: number;
}) {
  const headRef = useRef<HTMLHeadingElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const content = contentFor(g);
  useEffect(() => {
    if (focusSignal === 0) return;
    // Focus the first choice when there is one (accessibility §3.2), else the heading.
    const t = setTimeout(() => {
      const root = headRef.current?.closest('section');
      const first = root?.querySelector<HTMLElement>('[data-autofocus]');
      (first ?? headRef.current)?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [focusSignal]);
  const [hh, bh, fh] = parts;
  return (
    <section
      id="decision"
      className={`decision ${content.tall ? 'tall' : ''}`}
      style={{ top, height: hh + bh + fh }}
      aria-labelledby="decision-title"
      data-kind={g.mine ? (g.view.decision?.kind ?? 'none') : g.view.result ? 'over' : 'waiting'}
      data-mode={g.ui.kind}
    >
      <div className="dec-head" style={{ minHeight: hh }}>
        <h2 id="decision-title" ref={headRef} tabIndex={-1}>
          {content.title}
        </h2>
      </div>
      <div className="dec-body" style={{ height: bh }} ref={firstRef}>
        {g.ctl.error && (
          <p className="dec-error" role="alert">
            {g.ctl.error}
          </p>
        )}
        {content.body}
      </div>
      <div className={`dec-foot ${content.foot.equal ? 'equal' : ''}`} style={{ height: fh }}>
        {content.foot.secondary ? (
          <FootButton b={content.foot.secondary} primary={false} />
        ) : (
          <span className="grow" />
        )}
        {content.foot.primary && <FootButton b={content.foot.primary} primary />}
      </div>
    </section>
  );
}

function FootButton({ b, primary }: { b: FootBtn; primary: boolean }) {
  const disabled = b.disabled ?? false;
  return (
    <button
      type="button"
      id={b.id}
      data-autofocus={b.autoFocus ? '' : undefined}
      className={`btn big ${(primary && b.tone !== 'quiet') || b.tone === 'primary' ? 'primary' : ''} ${b.tone === 'warn' ? 'warn' : ''}`}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) b.onClick?.();
      }}
    >
      <span className="lbl2">
        {b.label} {b.key && <kbd>{b.key}</kbd>}
      </span>
      {(b.sub || (disabled && b.reason)) && (
        <span className="sub">{disabled && b.reason ? b.reason : b.sub}</span>
      )}
    </button>
  );
}

interface Content {
  title: string;
  body: ReactNode;
  foot: Foot;
  tall: boolean;
}

function contentFor(g: G): Content {
  const { view, ctl, legal, names } = g;
  const tall = isTall(g);
  const kind = view.decision?.kind;
  const rewind = {
    label: '⟲ Rewind',
    key: 'U',
    onClick: g.onRewind,
    disabled: g.ctl.session.actionCount === 0,
    id: 'rewind-btn',
  };

  // Game over (flows F15).
  if (view.result) {
    const r = view.result;
    const title = 'winner' in r ? winnerWords(names, r.winner) : 'Draw';
    return {
      title: 'Game over',
      tall: false,
      body: (
        <div>
          <p className="dec-big">
            {title} · Turn {view.turn.number}
          </p>
          <p>
            {'winner' in r
              ? resultReason(r.reason, r.winner, names)
              : 'Both players lost at the same time (CR 9-2-1).'}
          </p>
          {ctl.session.rewound && <p className="subtle">Rewound: not counted in your win rate.</p>}
          <p className="subtle">Game Review arrives in a later milestone. The full log is above.</p>
        </div>
      ),
      foot: {
        secondary: { label: 'New game', onClick: g.onNewGame, id: 'newgame-btn' },
        primary: { label: 'Rematch', key: 'Enter', onClick: g.onRematch, id: 'rematch-btn' },
      },
    };
  }

  // Waiting on the other side.
  if (!g.mine) return waitingContent(g, tall, rewind);

  switch (kind) {
    case 'chooseFirst':
      return {
        title: 'Who goes first',
        tall: false,
        body: (
          <div>
            <p className="dec-lead">
              {names.hotseat
                ? `${names.player[g.me]} won the roll: first or second?`
                : 'You won the roll: first or second?'}
            </p>
            <ul className="dec-list">
              <li>
                <b>First:</b> you attack first, but draw no card and get 1 DON!! on turn 1.
              </li>
              <li>
                <b>Second:</b> one card and one DON!! ahead on each of your turns.
              </li>
            </ul>
          </div>
        ),
        foot: {
          equal: true,
          secondary: { label: 'Go second', key: '2', onClick: () => pickFirst(g, false) },
          primary: {
            label: 'Go first',
            key: '1',
            onClick: () => pickFirst(g, true),
            id: 'first-btn',
            autoFocus: true,
          },
        },
      };
    case 'mulligan': {
      return {
        title: 'Your opening hand',
        tall: false,
        body: (
          <div>
            <p className="dec-lead">Keep this hand, or redraw all five?</p>
            <ol className="dec-list hand-list" aria-label="Opening hand">
              {view.zones[g.me].hand.map((c) => (
                <li key={c.handle}>
                  {g.nameOf(c.handle)}
                  {c.cost !== null && `, cost ${c.cost}`}
                  {c.card && g.cards.get(c.card)?.counter
                    ? `, Counter +${g.cards.get(c.card)!.counter}`
                    : ''}
                </li>
              ))}
            </ol>
            <p className="subtle">
              Redrawing shuffles these back. Life is placed after both players decide.
            </p>
          </div>
        ),
        foot: {
          equal: true,
          secondary: {
            label: 'Keep',
            key: 'K',
            onClick: () => mull(g, false),
            id: 'keep-btn',
            tone: 'primary',
            autoFocus: true,
          },
          primary: {
            label: 'Redraw',
            key: 'R',
            sub: 'all five, once',
            onClick: () => mull(g, true),
            tone: 'quiet',
            id: 'redraw-btn',
          },
        },
      };
    }
    case 'main':
      return mainContent(g, rewind);
    case 'block':
    case 'counter':
      return defenceContent(g);
    case 'trigger':
      return triggerContent(g);
    case 'choose':
      return chooseContent(g);
    case 'optional': {
      const yes = legal.optional.find((a) => a.type === 'optional' && a.accept);
      const no = legal.optional.find((a) => a.type === 'optional' && !a.accept);
      return {
        title: 'Optional effect',
        tall,
        body: <p className="dec-lead">{view.decision?.prompt}</p>,
        foot: {
          equal: true,
          secondary: { label: 'Skip', onClick: () => no && g.act(no) },
          primary: { label: 'Use', onClick: () => yes && g.act(yes), id: 'use-btn' },
        },
      };
    }
    case 'order':
      return {
        title: 'Resolve in this order',
        tall,
        body: (
          <div>
            <p className="dec-lead">{view.decision?.prompt}</p>
            <ol className="dec-list">
              {legal.order.map((a) => (
                <li key={a.type === 'order' ? a.first : ''}>
                  <button type="button" className="opt" onClick={() => g.act(a)}>
                    Resolve first: {a.type === 'order' ? a.first : ''}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ),
        foot: {},
      };
    default:
      return { title: view.decision?.prompt ?? '', tall, body: null, foot: {} };
  }
}

function pickFirst(g: G, first: boolean) {
  const a = g.legal.chooseFirst.find((x) => x.type === 'chooseFirst' && x.goFirst === first);
  if (a) g.act(a);
}
function mull(g: G, redraw: boolean) {
  const a = g.legal.mulligan.find((x) => x.type === 'mulligan' && x.redraw === redraw);
  if (a) g.act(a);
}

// ---------------------------------------------------------------------------------------------
// Waiting: the opponent's turn and the AI's decisions (board.md §5.3, flows F21)
// ---------------------------------------------------------------------------------------------

function waitingContent(g: G, tall: boolean, rewind: NonNullable<Foot['secondary']>): Content {
  const { ctl, view, names } = g;
  const d = view.decision;
  const who = d ? names.player[d.player] : '';
  const aiTurn = view.turn.activePlayer !== g.me;
  const status = ctl.considering
    ? `${who} is considering${ctl.considering === 'block' ? ' a block' : ctl.considering === 'counter' ? ' Counters' : ctl.considering === 'trigger' ? ' its Life card' : ''}…`
    : ctl.thinking
      ? `${who} is thinking…`
      : d
        ? waitingWords(d.kind, who)
        : '';
  const speed = (
    <div className="speed" role="radiogroup" aria-label="AI speed">
      {SPEEDS.map((s) => (
        <button
          key={String(s)}
          type="button"
          role="radio"
          aria-checked={ctl.speed === s}
          className="seg"
          onClick={() => ctl.setSpeed(s)}
        >
          {speedLabel(s)}
        </button>
      ))}
    </div>
  );
  const recap = ctl.recap && (
    <div className="recap">
      <p className="subtle">While you skipped:</p>
      <ul className="dec-list">
        {ctl.recap.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
  const battle = view.battle ? <BattleNumbers g={g} sim={null} perspective="watch" /> : null;
  return {
    title: view.battle
      ? battleTitle(g)
      : aiTurn
        ? `${names.hotseat ? names.player[view.turn.activePlayer] + '’s' : 'Opponent’s'} turn`
        : 'Your turn',
    tall,
    body: (
      <div>
        {battle}
        <p className="dec-status" aria-live="off">
          {ctl.thinking || ctl.considering ? <span className="bar" aria-hidden="true" /> : null}
          {status}
        </p>
        {ctl.activity && !view.battle && <p className="subtle">Last: {ctl.activity}</p>}
        {recap}
        {aiTurn && !names.hotseat && speed}
      </div>
    ),
    foot:
      aiTurn && !names.hotseat
        ? {
            secondary:
              ctl.speed === 'step'
                ? {
                    label: 'Next move',
                    key: '.',
                    onClick: () => ctl.nextMove(),
                    disabled: !ctl.stepWaiting,
                  }
                : {
                    label: ctl.paused ? 'Resume' : 'Pause',
                    key: 'K',
                    onClick: () => ctl.togglePause(),
                  },
            primary: {
              label: 'Skip to my decision',
              key: 'S',
              sub: 'stops when you have a choice',
              onClick: () => ctl.skip(),
              disabled: ctl.skipping,
              id: 'skip-btn',
            },
          }
        : { secondary: rewind },
  };
}

function waitingWords(kind: string, who: string): string {
  switch (kind) {
    case 'main':
      return `${who} is in its Main Phase.`;
    case 'block':
      return `${who} is choosing whether to block.`;
    case 'counter':
      return `${who} is choosing Counters.`;
    case 'trigger':
      return `${who} is taking damage.`;
    case 'mulligan':
      return `${who} is deciding whether to redraw.`;
    case 'chooseFirst':
      return `${who} is choosing who goes first.`;
    default:
      return `${who} is deciding.`;
  }
}

function battleTitle(g: G): string {
  const b = g.view.battle!;
  const a = g.nameOf(b.attacker);
  const t = g.cardOf(b.target);
  const tname =
    t?.zone === 'leader' ? `${t.owner === g.me ? 'your' : 'their'} Leader` : g.nameOf(b.target);
  return `${a} attacks ${tname}`;
}

// ---------------------------------------------------------------------------------------------
// Main phase (flows F4, board.md §4.2)
// ---------------------------------------------------------------------------------------------

function mainContent(g: G, rewind: NonNullable<Foot['secondary']>): Content {
  const { view, legal, ui } = g;
  const me = g.me;
  const endTurn = () => legal.endTurn && g.act(legal.endTurn);
  const canAttack = [...legal.attacks.keys()];
  const playable = [...legal.play.keys()];
  const active = view.don[me].active;
  const sub = `${canAttack.length} can attack · ${active} DON!! unused`;
  const endBtn = { label: 'End turn', key: 'E', sub, onClick: endTurn, id: 'endturn-btn' };

  if (ui.kind === 'confirm') return confirmContent(g, ui.attacker, ui.target);

  if (ui.kind === 'target') {
    const targets = legal.attacks.get(ui.attacker) ?? [];
    return {
      title: `Attack with ${g.nameOf(ui.attacker)}`,
      tall: false,
      body: (
        <div>
          <p className="dec-lead">
            Choose a target. Only your opponent’s Leader and rested Characters can be attacked.
          </p>
          <div className="opts col">
            {targets.map((a, i) => (
              <button
                key={a.type === 'attack' ? a.target : i}
                type="button"
                className="opt"
                data-first={i === 0 ? '' : undefined}
                onClick={() =>
                  a.type === 'attack' &&
                  g.setUi({ kind: 'confirm', attacker: ui.attacker, target: a.target })
                }
              >
                ⌖ {a.type === 'attack' ? targetWords(g, a.target) : ''}
              </button>
            ))}
          </div>
        </div>
      ),
      foot: {
        secondary: { label: 'Cancel', key: 'Esc', onClick: () => g.setUi({ kind: 'idle' }) },
      },
    };
  }

  if (ui.kind === 'don' || ui.kind === 'count') {
    const recipients = [...legal.give.keys()];
    return {
      title: `Giving DON!! · ${active} active`,
      tall: false,
      body: (
        <div>
          <p className="dec-lead">
            Click a lit card (◆) to give it 1 DON!!. Each gives <b>+1000 on your turn only</b>.
          </p>
          <table className="tbl">
            <tbody>
              {recipients.map((h) => {
                const c = g.cardOf(h);
                return (
                  <tr key={h}>
                    <td>
                      <button type="button" className="linkbtn" onClick={() => giveOne(g, h)}>
                        {c?.zone === 'leader' ? 'Your Leader' : g.nameOf(h)}
                      </button>
                    </td>
                    <td className="num r">
                      {num(c?.power)} → {num((c?.power ?? 0) + 1000)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
      foot: {
        secondary: rewind,
        primary: {
          label: 'Done',
          key: 'Esc',
          sub: `${active} DON!! left to give`,
          onClick: () => g.setUi({ kind: 'idle' }),
          id: 'don-done',
        },
      },
    };
  }

  if (ui.kind === 'selected') {
    const c = g.cardOf(ui.handle);
    const play = legal.play.get(ui.handle);
    const attacks = legal.attacks.get(ui.handle);
    const give = legal.give.get(ui.handle);
    const why =
      c?.zone === 'hand' && !play
        ? g.ctl.session.whyNot(me, { type: 'playCard', card: ui.handle })
        : null;
    return {
      title: `${g.nameOf(ui.handle)} selected`,
      tall: false,
      body: (
        <div>
          <p className="subtle">
            {c?.card?.category}
            {c?.card?.cost !== null && c?.card?.cost !== undefined ? ` · cost ${c.card.cost}` : ''}
            {c?.power !== null && c?.power !== undefined ? ` · ${num(c.power)}` : ''}
          </p>
          <div className="opts col">
            {play && (
              <button type="button" className="opt" data-first="" onClick={() => g.act(play)}>
                ▶ Play · rest {c?.card?.cost ?? 0} DON!! <kbd>P</kbd>
              </button>
            )}
            {attacks && (
              <button
                type="button"
                className="opt"
                onClick={() => g.setUi({ kind: 'target', attacker: ui.handle })}
              >
                ⚔ Attack… <kbd>A</kbd>
              </button>
            )}
            {give && (
              <button
                type="button"
                className="opt"
                onClick={() => g.setUi({ kind: 'count', target: ui.handle, n: 1 })}
              >
                ◆ Give DON!!… <kbd>+</kbd>
              </button>
            )}
            <button type="button" className="opt" onClick={() => g.openInspector(ui.handle)}>
              Inspect <kbd>I</kbd>
            </button>
          </div>
          {why && (
            <p className="why">
              {why.text}
              {why.rule ? ` (${why.rule})` : ''}
            </p>
          )}
        </div>
      ),
      foot: {
        secondary: { label: 'Cancel', key: 'Esc', onClick: () => g.setUi({ kind: 'idle' }) },
      },
    };
  }

  const sick = view.zones[me].characters.filter(
    (c) => !c.rested && !legal.attacks.has(c.handle) && view.turn.number > 2,
  );
  return {
    title: 'Your Main phase',
    tall: false,
    body: (
      <div>
        <p className="dec-lead">Play a card, give DON!!, attack, or end your turn.</p>
        <ul className="dec-list">
          <li>
            <b>{canAttack.length} can attack</b>
            {canAttack.length
              ? `: ${canAttack.map((h) => (g.cardOf(h)?.zone === 'leader' ? 'your Leader' : g.nameOf(h))).join(', ')}`
              : ''}{' '}
            <span className="subtle">(⚔)</span>
          </li>
          <li>
            <b>{playable.length} cards playable</b> from hand <span className="subtle">(▶)</span>
          </li>
          <li>
            <b>{active} DON!! active</b>
            {legal.give.size ? ' · click your cost area to give' : ''}
          </li>
        </ul>
        {view.turn.number <= 2 && (
          <p className="subtle">No battles on your first turn (CR 6-5-6-1).</p>
        )}
        {sick.length > 0 && (
          <p className="subtle">
            {sick.map((c) => g.nameOf(c.handle)).join(', ')}: played this turn, no attack until next
            turn.
          </p>
        )}
      </div>
    ),
    foot: { secondary: rewind, primary: endBtn },
  };
}

export function giveOne(g: G, target: string) {
  const a = g.legal.give.get(target);
  if (!a) return;
  g.act(a, donIntent(target));
}

/** Consecutive gives to the same card share one intentId (board.md §4.2: one log line, one rewind). */
let lastDon: { target: string; id: string; at: number } | null = null;
export function donIntent(target: string): string {
  const now = Date.now();
  if (!lastDon || lastDon.target !== target || now - lastDon.at > 15000)
    lastDon = { target, id: newIntentId(), at: now };
  lastDon.at = now;
  return lastDon.id;
}
export function resetDonIntent() {
  lastDon = null;
}

function targetWords(g: G, handle: string): string {
  const c = g.cardOf(handle);
  if (!c) return '';
  if (c.zone === 'leader') return `${c.owner === g.me ? 'Your' : 'Their'} Leader · ${num(c.power)}`;
  return `${g.nameOf(handle)} (rested) · ${num(c.power)}`;
}

// ---------------------------------------------------------------------------------------------
// Battle panel (board.md §3.10)
// ---------------------------------------------------------------------------------------------

function BattleNumbers({
  g,
  sim,
  perspective,
  attacker,
  target,
  breakdownDef,
}: {
  g: G;
  sim: Simulation | null;
  perspective: 'attack' | 'defend' | 'watch';
  attacker?: string;
  target?: string;
  breakdownDef?: string;
}) {
  const b = g.view.battle;
  const atk = attacker ?? b?.attacker ?? '';
  const tgt = target ?? sim?.view.battle?.target ?? b?.target ?? '';
  const a = g.cardOf(atk);
  const t = sim ? simCard(sim, tgt) : g.cardOf(tgt);
  const ap = sim?.damage?.attackerPower ?? a?.power ?? 0;
  const tp = sim?.damage?.targetPower ?? t?.power ?? 0;
  const aBase = a?.card?.power ?? 0;
  const aDon = (a ? findCard(g, atk)?.don : 0) ?? 0;
  const label = (h: string, c: ReturnType<G['cardOf']> | null) =>
    c?.zone === 'leader' ? `${c.owner === g.me ? 'Your' : 'Their'} Leader` : g.nameOf(h);
  return (
    <div className="battle" data-perspective={perspective}>
      <div className="bn">
        <span className="bn-role">Attacker</span>
        <span className="bn-name">
          {g.nameOf(atk)}
          {a?.zone === 'leader' && (
            <span className="subtle"> ({a.owner === g.me ? 'your' : 'their'} Leader)</span>
          )}
          <span className="bn-bd">
            {breakdown(aBase, aDon, ap, g.view.turn.activePlayer === a?.owner)}
          </span>
        </span>
        <span className="bn-num num" data-testid="attacker-power">
          {num(ap)}
        </span>
      </div>
      <div className="bn">
        <span className="bn-role">Defender</span>
        <span className="bn-name">
          {label(tgt, t)}
          <span className="bn-bd">
            {breakdownDef ??
              (t?.card?.power !== undefined && t?.card?.power !== null && t.card.power !== tp
                ? `${num(t.card.power)} + ${num(tp - t.card.power)}`
                : 'no change')}
          </span>
        </span>
        <span className="bn-num num" data-testid="defender-power">
          {num(tp)}
        </span>
      </div>
    </div>
  );
}

function breakdown(base: number, don: number, now: number, ownersTurn: boolean): string {
  const parts = [num(base)];
  if (don && ownersTurn) parts.push(`${don * 1000} DON!!`);
  const rest = now - base - (ownersTurn ? don * 1000 : 0);
  if (rest) parts.push(`${rest > 0 ? '' : MINUS}${Math.abs(rest)} effects`);
  return parts.length > 1 ? parts.join(' + ').replace('+ −', '− ') : 'base';
}
const MINUS = '−';

function findCard(g: G, handle: string) {
  for (const p of ['p1', 'p2'] as PlayerId[])
    for (const z of Object.values(g.view.zones[p])) {
      const c = z.find((x) => x.handle === handle);
      if (c) return c;
    }
  return null;
}

function simCard(
  sim: Simulation,
  handle: string,
): { card: undefined; power: number | null; owner: PlayerId; zone: string } | null {
  for (const p of ['p1', 'p2'] as PlayerId[])
    for (const [zone, cards] of Object.entries(sim.view.zones[p])) {
      const c = cards.find((x) => x.handle === handle);
      if (c) return { card: undefined, power: c.power, owner: p, zone };
    }
  return null;
}

function confirmContent(g: G, attacker: string, target: string): Content {
  const action = (g.legal.attacks.get(attacker) ?? []).find(
    (a) => a.type === 'attack' && a.target === target,
  );
  const preview = action ? g.ctl.session.preview(g.me, action) : null;
  const a = g.cardOf(attacker);
  const t = g.cardOf(target);
  const ap = a?.power ?? 0;
  const tp = t?.power ?? 0;
  const opp = other(g.me);
  const lifeNow = g.view.zones[opp].life.length;
  const lifeAfter = preview?.life[opp] ?? lifeNow;
  const ko = preview?.ko.includes(target) ?? false;
  const wins = preview?.gameOver ?? false;
  const ok = wins || ko || lifeAfter < lifeNow;
  const result = wins
    ? '✓ Wins the game if it is not stopped'
    : ko
      ? `✓ K.O.s ${g.nameOf(target)}`
      : lifeAfter < lifeNow
        ? `✓ Hit lands · their Life ${lifeNow} → ${lifeAfter}`
        : '✕ Attack fails';
  const need = ap >= tp ? ap - tp + 1000 : 0;
  const hand = g.view.zones[opp].hand.length;
  return {
    title: `Attack · ${g.nameOf(attacker)} → ${t?.zone === 'leader' ? 'their Leader' : g.nameOf(target)}`,
    tall: true,
    body: (
      <div>
        <BattleNumbers g={g} sim={null} perspective="attack" attacker={attacker} target={target} />
        <p className={`result ${ok ? 'good' : 'bad'}`} data-testid="battle-result">
          <span>
            {result}
            {ap === tp && <span className="subtle"> · ties go to the attacker</span>}
          </span>
        </p>
        {need > 0 && (
          <p>
            They need <b>+{num(need)}</b> to survive · {hand} cards in hand
          </p>
        )}
        {findCard(g, attacker)?.keywords.includes('Double Attack') && (
          <p>Double Attack: 2 damage.</p>
        )}
        {findCard(g, attacker)?.keywords.includes('Banish') && (
          <p>Banish: Life card is trashed, no Trigger.</p>
        )}
        <p className="subtle">Enter or click the target again to attack. Esc goes back.</p>
      </div>
    ),
    foot: {
      secondary: {
        label: 'Cancel',
        key: 'Esc',
        onClick: () => g.setUi({ kind: 'target', attacker }),
      },
      primary: {
        label: 'Confirm attack',
        key: 'Enter',
        sub: `${num(ap)} vs ${num(tp)}`,
        onClick: () => action && g.act(action),
        id: 'confirm-attack',
      },
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Defence planner (flows F6, accessibility §3.10): staged, chained previews, one commit
// ---------------------------------------------------------------------------------------------

export function stagedActions(g: G, s: Staging): Action[] {
  const me = g.me;
  const out: Action[] = [];
  if (g.view.decision?.kind === 'block')
    out.push({ type: 'block', blocker: s.blocker, player: me });
  for (const c of s.counters)
    out.push({ type: 'counter', card: c.card, target: c.target, player: me });
  return out;
}

/** The counter options once the block is settled (from the scratch view when still in the Block step). */
export function counterOptions(g: G, s: Staging): Map<string, Action[]> {
  if (g.view.decision?.kind === 'counter') return g.legal.counters;
  const sim = g.ctl.session.simulate(g.me, [{ type: 'block', blocker: s.blocker, player: g.me }]);
  const m = new Map<string, Action[]>();
  for (const a of sim.view.actions) {
    if (a.type !== 'counter') continue;
    const l = m.get(a.card) ?? [];
    l.push(a);
    m.set(a.card, l);
  }
  return m;
}

export function defendingTarget(g: G, s: Staging): string {
  return s.blocker ?? g.view.battle?.target ?? '';
}

function defenceContent(g: G): Content {
  const { view, staging: s } = g;
  const me = g.me;
  const b = view.battle!;
  const inBlock = view.decision?.kind === 'block';
  const sim = cachedSim(g, s);
  const none = g.ctl.session.simulate(
    g.me,
    inBlock ? [{ type: 'block', blocker: null, player: me }] : [],
  );
  const ap = sim.damage?.attackerPower ?? 0;
  const tp = sim.damage?.targetPower ?? 0;
  const hits = sim.damage?.attackerWins ?? true;
  const targetH = defendingTarget(g, s);
  const t = g.cardOf(targetH);
  const leaderTarget = t?.zone === 'leader';
  const lifeNow = view.zones[me].life.length;
  const noneLife = none.lifeAfter[me];
  const takeSub =
    leaderTarget || !s.blocker
      ? g.cardOf(b.target)?.zone === 'leader'
        ? `Life ${lifeNow} → ${noneLife}${none.gameOver ? ' · you lose' : ''}`
        : `${g.nameOf(b.target)} K.O.’d`
      : '';
  const staged = s.counters.length > 0;
  const total = s.counters.reduce((n, c) => n + (g.cardOf(c.card)?.card?.counter ?? 0), 0);
  const need = hits ? ap - tp + 1000 : 0;
  const options = counterOptions(g, s);
  const take = () => commitDefence(g, { blocker: null, counters: [] });
  const commit = () => commitDefence(g, s);
  const blockers = [...g.legal.blocks.keys()];
  const targetWord = leaderTarget ? 'your Leader' : g.nameOf(targetH);
  const result = hits
    ? leaderTarget
      ? `✕ Hit lands · your Life ${lifeNow} → ${sim.lifeAfter[me]}${sim.gameOver ? ' · you lose' : ''}`
      : `✕ K.O. · ${g.nameOf(targetH)}`
    : '✓ Attack fails';
  const hotseatHidden = g.ctl.handHidden();

  let foot: Foot;
  const takeBtn = { label: 'Take the hit', sub: takeSub, onClick: take, id: 'take-hit' };
  if (s.blocker) {
    foot = {
      // Taking the hit stays one action away even with a Blocker chosen (UX-R2).
      secondary: { ...takeBtn, sub: `${takeSub} · no block` },
      primary: {
        label: `Block with ${g.nameOf(s.blocker)}${staged ? ` · +${num(total)}` : ''}`,
        key: 'Enter',
        sub: hits
          ? `${g.nameOf(s.blocker)} K.O.’d · Life stays ${lifeNow}`
          : `${g.nameOf(s.blocker)} survives`,
        onClick: commit,
        id: 'commit-defence',
      },
    };
  } else if (!staged) {
    foot = {
      secondary: {
        label: 'Counter',
        disabled: true,
        reason: hotseatHidden ? 'hold R to see your hand' : 'Stage a lit hand card',
        onClick: commit,
      },
      primary: takeBtn,
    };
  } else if (hits) {
    foot = {
      secondary: {
        label: 'Play anyway',
        sub: 'still hits',
        tone: 'warn',
        onClick: commit,
        id: 'play-anyway',
      },
      primary: { ...takeBtn, sub: `${takeSub} · staging discarded` },
    };
  } else {
    foot = {
      secondary: { ...takeBtn },
      primary: {
        label: `Counter +${num(total)}`,
        key: 'Enter',
        sub: `survive · ${num(tp)} vs ${num(ap)}${tp - ap >= 2000 ? ` · ${num(tp - ap - 1000)} more than needed` : ''}`,
        onClick: commit,
        id: 'commit-defence',
      },
    };
  }
  const hand = view.zones[me].hand;
  const counterCards = hand.filter((c) => options.has(c.handle));
  return {
    title: `Defend ${targetWord} · ${g.nameOf(b.attacker)} attacks`,
    tall: true,
    body: (
      <div className="defend">
        <BattleNumbers
          g={g}
          sim={sim}
          perspective="defend"
          target={targetH}
          breakdownDef={
            staged
              ? `${num(tp - total)} + ${num(total)} staged (${s.counters.map((c) => g.nameOf(c.card)).join(', ')})`
              : s.blocker
                ? `redirected from your Leader`
                : undefined
          }
        />
        <p className={`result ${hits ? 'bad' : 'good'}`} data-testid="battle-result">
          <span>{ap === tp && hits ? '✕ Ties go to the attacker' : result}</span>
          {hits && <span className="need">Need +{num(need)} more</span>}
        </p>
        {staged && hits && (
          <p className="warnline">
            <span aria-hidden="true">⚠</span> {num(tp)} vs {num(ap)} still hits. Add {num(need)}{' '}
            more to stop it, or take the hit and keep your cards.
          </p>
        )}
        <div className="lanes">
          <div className="lane">
            <span className="ln">Block</span>
            <div className="opts" role="group" aria-label="Block">
              {inBlock ? (
                <>
                  <button
                    type="button"
                    className="opt"
                    aria-pressed={s.blocker === null}
                    onClick={() => g.setStaging({ ...s, blocker: null })}
                  >
                    No block
                  </button>
                  {blockers.map((h) => {
                    const r = g.ctl.session.simulate(me, [
                      { type: 'block', blocker: h, player: me },
                    ]);
                    const dies = r.damage?.attackerWins;
                    return (
                      <button
                        key={h}
                        type="button"
                        className="opt"
                        aria-pressed={s.blocker === h}
                        onClick={() => g.setStaging({ ...s, blocker: s.blocker === h ? null : h })}
                      >
                        {g.nameOf(h)} {num(g.cardOf(h)?.power)} · {dies ? 'K.O.’d' : 'survives'}
                      </button>
                    );
                  })}
                  {blockers.length === 0 && <span className="subtle">none available</span>}
                </>
              ) : (
                <span className="subtle">
                  {b.blocker ? `Blocked by ${g.nameOf(b.blocker)}` : 'none'}
                </span>
              )}
            </div>
          </div>
          <div className="lane">
            <span className="ln">Counter</span>
            <div className="opts" role="group" aria-label="Counter">
              {hotseatHidden ? (
                <span className="subtle">
                  {g.names.player[me]}: press and hold R to see your hand.
                </span>
              ) : counterCards.length === 0 ? (
                <span className="subtle">No Counter cards in hand</span>
              ) : (
                counterCards.map((c) => {
                  const on = s.counters.some((x) => x.card === c.handle);
                  return (
                    <button
                      key={c.handle}
                      type="button"
                      className="opt"
                      aria-pressed={on}
                      onClick={() => toggleCounter(g, c.handle)}
                    >
                      {g.nameOf(c.handle)} +{num(g.cardOf(c.handle)?.card?.counter)}
                      {on ? ' ✓' : ''}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <div className="lanehd">
            <span className="subtle">Click lit hand cards to stage · ties go to the attacker</span>
            <button
              type="button"
              className="btn small"
              aria-disabled={!staged && !s.blocker}
              onClick={() => g.setStaging({ blocker: null, counters: [] })}
            >
              Clear <kbd>Esc</kbd>
            </button>
          </div>
        </div>
      </div>
    ),
    foot,
  };
}

function cachedSim(g: G, s: Staging): Simulation {
  // Not a hook: a plain cached call keyed by the staging, so lanes and footer share it.
  const key = `${g.ctl.session.version}|${g.me}|${JSON.stringify(s)}`;
  if (simCache.key !== key)
    simCache = { key, sim: g.ctl.session.simulate(g.me, stagedActions(g, s)) };
  return simCache.sim!;
}
let simCache: { key: string; sim: Simulation | null } = { key: '', sim: null };

export function toggleCounter(g: G, handle: string) {
  const s = g.staging;
  if (s.counters.some((c) => c.card === handle)) {
    g.setStaging({ ...s, counters: s.counters.filter((c) => c.card !== handle) });
    return;
  }
  const opts = counterOptions(g, s).get(handle);
  if (!opts) return;
  const target = defendingTarget(g, s);
  const a = opts.find((x) => x.type === 'counter' && x.target === target) ?? opts[0];
  if (a?.type === 'counter')
    g.setStaging({ ...s, counters: [...s.counters, { card: handle, target: a.target }] });
}

export function commitDefence(g: G, s: Staging) {
  const me = g.me;
  const seq: Action[] = [];
  if (g.view.decision?.kind === 'block')
    seq.push({ type: 'block', blocker: s.blocker, player: me });
  for (const c of s.counters)
    seq.push({ type: 'counter', card: c.card, target: c.target, player: me });
  seq.push({ type: 'endCounter', player: me });
  g.ctl.actSequence(seq);
  g.setStaging({ blocker: null, counters: [] });
}

// ---------------------------------------------------------------------------------------------
// Damage: the decision for each Life card (CR 4-6-3, 10-1-5; flows F6 step 8)
// ---------------------------------------------------------------------------------------------

function triggerContent(g: G): Content {
  const hidden = g.ctl.handHidden();
  const activate = g.legal.triggers.find((a) => a.type === 'trigger' && a.activate);
  const toHand = g.legal.triggers.find((a) => a.type === 'trigger' && !a.activate);
  const why = activate ? null : g.ctl.session.whyNot(g.me, { type: 'trigger', activate: true });
  const prompt = g.view.decision?.prompt ?? '';
  const nm =
    /Damage: (?:activate the \[Trigger\] of |add )(.+?)(?:,| to your hand)/.exec(prompt)?.[1] ?? '';
  const life = g.view.zones[g.me].life.length;
  return {
    title: 'Damage · your top Life card',
    tall: true,
    body: hidden ? (
      <p className="dec-lead">
        {g.names.player[g.me]}: press and hold R to see your Life card. Only you should look.
      </p>
    ) : (
      <div>
        <p className="dec-lead" data-testid="life-card">
          {nm ? (
            <>
              Life card: <b>{nm}</b>
            </>
          ) : (
            prompt
          )}
        </p>
        <p className="subtle">
          Only you see this. Life {life} → {life - 1}.
        </p>
        <ul className="dec-list">
          <li>
            <b>Activate Trigger:</b>{' '}
            {activate ? 'reveal it and use its [Trigger].' : (why?.text ?? 'not available')}
          </li>
          <li>
            <b>Add to hand:</b> hand +1, kept hidden from your opponent.
          </li>
        </ul>
      </div>
    ),
    foot: {
      equal: true,
      secondary: {
        label: 'Activate Trigger',
        disabled: !activate,
        reason: why?.text ? 'not available' : undefined,
        onClick: () => activate && g.act(activate),
        id: 'trigger-activate',
      },
      primary: {
        label: 'Add to hand',
        key: 'Enter',
        onClick: () => toHand && g.act(toHand),
        id: 'trigger-hand',
        autoFocus: true,
      },
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Picks: multi-select with a running count and one commit (flows F8a, accessibility §3.8)
// ---------------------------------------------------------------------------------------------

function chooseContent(g: G): Content {
  const d = g.view.decision!;
  const min = d.min ?? 0;
  const max = d.max ?? 1;
  const cands = [...g.legal.picks.keys()];
  const chosen = g.picks.filter((h) => g.legal.picks.has(h));
  const ready = chosen.length >= min && chosen.length <= max;
  const commit = () => {
    // Picks go to the engine in canonical (candidate) order, then `done` if still owed.
    const order = [...g.legal.picks.entries()]
      .filter(([h]) => chosen.includes(h))
      .map(([, a]) => a);
    const seq: Action[] = [...order];
    if (chosen.length < max) seq.push({ type: 'done', player: g.me });
    g.ctl.actSequence(seq);
    g.setPicks([]);
  };
  return {
    title: 'Choose',
    tall: true,
    body: (
      <div>
        <p className="dec-lead">{d.prompt}</p>
        <p className="count-line" role="status">
          {chosen.length} of {min === max ? max : `up to ${max}`} chosen
        </p>
        <div className="opts col" role="group" aria-label="Candidates">
          {cands.map((h, i) => {
            const on = chosen.includes(h);
            return (
              <button
                key={h}
                type="button"
                className="opt"
                aria-pressed={on}
                data-first={i === 0 ? '' : undefined}
                onClick={() =>
                  g.setPicks(
                    on
                      ? chosen.filter((x) => x !== h)
                      : chosen.length < max
                        ? [...chosen, h]
                        : max === 1
                          ? [h]
                          : chosen,
                  )
                }
              >
                ⌖ {g.nameOf(h)} · {num(g.cardOf(h)?.power)}
                {on ? ` ✓ ${chosen.indexOf(h) + 1}` : ''}
              </button>
            );
          })}
        </div>
        <p className="subtle">
          Trashing to make room is not a K.O.: [On K.O.] effects don’t happen.
        </p>
      </div>
    ),
    foot: {
      secondary: { label: 'Reset', onClick: () => g.setPicks([]), disabled: chosen.length === 0 },
      primary: {
        label: chosen.length === 0 && min === 0 ? 'Choose none' : 'Done',
        key: 'Enter',
        sub: `${chosen.length} of ${max}`,
        onClick: commit,
        disabled: !ready,
        id: 'choose-done',
      },
    },
  };
}

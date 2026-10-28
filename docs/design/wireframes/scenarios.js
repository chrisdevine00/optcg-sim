/*
 * Board positions used by the wireframes. Each returns a fresh config for WF.renderBoard.
 * Story: you play Rocks.D.Xebec (OP17-039) against Kaido (OP17-058) at Pirate tier, unless a screen says otherwise.
 * Positions that come from explanations.md say which example (E01–E20) they reproduce.
 */
(function () {
  const you = (t) => `<span class="chip you">You</span>${t}`;
  const opp = (t, why = true) => `<span class="chip opp">Opp</span>${t}${why ? ' <a class="why" href="09c-why.html">Why?</a>' : ''}`;
  const lk = (n) => `<a class="lk" href="10-inspector.html">${n}</a>`;
  const th = (t) => `<li class="th">${t}</li>`;
  const rewind = '<button class="btn" type="button" data-key="U" aria-label="Rewind one move (U)">⟲ Rewind <kbd>U</kbd></button>';

  function oppKaidoStd() {
    return {
      idText: 'Kaido · Pirate AI', hand: 5, donDeck: 2, active: 1, rested: 6, life: 3, deck: 31,
      leader: K('OP17-058', { who: 'Opponent’s' }),
      stage: null,
      trash: { n: 4, top: K('OP15-078') },
      chars: [null, K('EB04-031', { r: true, don: 1, donOff: true, who: 'Opponent\u2019s' }), K('OP17-074', { who: 'Opponent\u2019s' }), K('OP17-060', { who: 'Opponent\u2019s' }), null],
    };
  }

  // Battle panel body (board.md §3.10)
  function battle(b) {
    const row = (lbl, x) => `<div class="bp-row"><span class="who">${lbl}</span><span class="nm2">${x.name}</span><span class="bp-num num">${x.num}</span><span class="bd">${x.bd || ''}</span></div>`;
    return `${b.pre || ''}${row('Attacker', b.att)}${row('Defender', b.def)}
      <div class="bp-res ${b.res.cls}" role="status"><span aria-hidden="true">${b.res.cls === 'ok' ? '✓' : '✕'}</span>${b.res.text}${b.res.need ? `<span class="need">${b.res.need}</span>` : ''}</div>${b.post || ''}`;
  }
  // Results by perspective (UX-R19): good for you = ok (✓, success colour), bad for you = hit (✕, danger colour)
  // Primary button: one dedicated key, shown on the button and wired by wf.js through data-key (board.md §4.4)
  const primary = (label, sub, key, href, extra = '') => `<${href ? `a href="${href}"` : 'button type="button"'} class="btn primary big pri ${extra}" ${key ? `data-key="${key}"` : ''}><span class="lbl2">${label}${key ? ` <kbd aria-label="${key}">${key === 'Enter' ? '↵' : key}</kbd>` : ''}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</${href ? 'a' : 'button'}>`;
  // Secondary commit in the same footer: equal height, never the default (board.md §3.9, UX-R2)
  const secondary = (label, sub, extra = '', attrs = '') => `<button type="button" class="btn big sec ${extra}" ${attrs}><span class="lbl2">${label}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</button>`;

  // Preview dock (board.md §3.12): full scan with SAMPLE, our own text, live stats with breakdowns
  function dock(g, d) {
    const r = g.dock; const roomy = g.W > 1600;
    const sw = roomy ? 240 : 168, sh = roomy ? 335 : 235;
    return `<aside class="dock" aria-hidden="true" style="left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px">
      <div style="display:flex;gap:12px;padding:12px">
        <div class="scan c-${d.col || 'blue'}" style="width:${sw}px;height:${sh}px"><span class="al">art (full scan)</span><span class="sample">SAMPLE</span><span class="ptxt"></span><span class="pnm"></span></div>
        <div style="min-width:0;font-size:13px;line-height:18px">
          <div style="font-weight:600;font-size:${roomy ? 18 : 16}px;line-height:1.25">${d.name}</div>
          <div class="muted" style="margin:2px 0 8px">${d.id}</div>
          ${d.stats}
        </div></div>
      <div style="padding:0 12px 12px;font-size:var(--text-md);line-height:var(--leading-md)">${d.text}</div></aside>`;
  }

  window.SCN = {
    you, opp, lk, th, rewind, battle, primary, secondary, dock,
    // Turn 7, your Main Phase (your 4th turn, going first): 7 DON!!
    mainBase() {
      const o = oppKaidoStd();

      return {
        boardLabel: 'Game board, turn 7, your Main Phase',
        opp: o,
        me: {
          donDeck: 3, active: 2, rested: 3, life: 4, deck: 30,
          leader: K('OP17-039', { who: 'Your', don: 2, p: 7000 }),
          stage: null,
          trash: { n: 6, top: K('OP17-056') },
          chars: [null, K('OP17-044', { r: true }), K('OP17-048'), K('OP17-054', { chips: [{ t: 'New', pos: 'top' }] }), null],
          hand: [
            K('OP17-046', { hand: true }),
            K('OP08-051', { hand: true, playable: true }),
            K('OP17-056', { hand: true }),
            K('OP17-045', { hand: true, playable: true }),
            K('OP17-049', { hand: true }),
            K('OP17-055', { hand: true, playable: true, timing: '[Main]' }),
          ],
        },
        mid: { turn: 'Turn 7 · Your turn', phase: 'Main' },
        log: [
          th('Turn 6 · Opp'),
          opp('Refresh · Draw · DON!! +2 · 7 DON!!', false),
          opp(`Play ${lk('Ulti & Page One')} · 6 DON!!`),
          '<li>On Play: +1 DON!! active · no Character at 3000 or less</li>',
          opp(`Give 1 DON!! to ${lk('King')} · 8000`, false),
          opp(`${lk('King')} attacks your Leader · 8000 vs 5000`),
          you(`Counter: ${lk('Rocks Pirates')} +2000 · 5000 → 7000`),
          '<li>Hit · your Life 5 → 4 · +1 card</li>',
          opp('End of turn · 1 active DON!!', false),
          th('Turn 7 · You'),
          you('Refresh · Draw: Gloriosa · DON!! +2 · 7 DON!!'),
          you(`Play ${lk('Miss Buckingham Stussy')} · 3 DON!!`),
          '<li>On Play: King can’t attack until their next End Phase</li>',
          you(`${lk('Captain John')} attacks their Leader · 6000 vs 5000`),
          '<li>Hit · their Life 4 → 3</li>',
          you(`Give 2 DON!! to ${lk('Rocks.D.Xebec')} · 7000`),
        ],
        coachStrip: { tempo: '5 of 7' },
      };
    },
  };
})();

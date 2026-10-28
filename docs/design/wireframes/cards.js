/*
 * Card data used by the wireframes. Names, costs, powers and counters are from optcgapi
 * (.cache/track-b/raw/optcgapi-allSetCards.json, -allSTCards.json, read 2026-10-28), for cards in the
 * Rocks (OP17-039) and Kaido (OP17-058) lists in docs/research/meta-lists.json.
 * optcgapi drops minus signs (data-sources.md); text quoted here has them restored ("DON!! −1", "−2000").
 * The Luffy OP13-001 cards appear only where explanations.md uses them (E15).
 * No images. `col` picks a placeholder tint for the art window and the colour band.
 */
(function () {
  const D = {
    // Rocks.D.Xebec (Blue)
    'OP17-039': { n: 'Rocks.D.Xebec', kind: 'Leader', p: 5000, col: 'blue', life: 5, text: '[When Attacking] You may trash 1 card from your hand: Reveal 1 card from the top of your deck. If the revealed card’s type includes "Rocks Pirates", draw 2 cards.' },
    'OP08-051': { n: 'Buckin', kind: 'Character', cost: 1, p: 2000, ctr: '+1000', col: 'blue', text: '[Your Turn] [On Play] Up to 1 of your [Edward Weevil] cards gains +2000 power during this turn.' },
    'OP17-040': { n: 'Edward.Newgate', kind: 'Character', cost: 6, p: 8000, col: 'blue', text: '[On Play] Draw 1 card. [Once Per Turn] When your Leader with a type including "Rocks Pirates" attacks or is attacked, you may trash 1 card from your hand to activate this effect. Your Leader gains +3000 power during this battle.' },
    'OP17-042': { n: 'Kaido', kind: 'Character', cost: 4, p: 6000, col: 'blue', kw: ['blocker'] },
    'OP17-044': { n: 'Captain John', kind: 'Character', cost: 4, p: 6000, col: 'blue' },
    'OP17-045': { n: 'Kyo', kind: 'Character', cost: 2, p: 4000, col: 'blue', text: 'If one of your Characters would be removed from the field by your opponent’s effect, you may trash 2 cards from your hand instead. [On Play] Draw 1 card.' },
    'OP17-046': { n: 'Gloriosa', kind: 'Character', cost: 4, p: 1000, col: 'blue', kw: ['blocker'], text: '[Blocker] [On Play] Place up to 1 Character with a cost of 5 or less at the bottom of the owner’s deck.' },
    'OP17-048': { n: 'Shiki', kind: 'Character', cost: 7, p: 9000, col: 'blue', kw: ['rushc'], text: '[Rush: Character] [When Attacking]/[On Your Opponent’s Attack] [Once Per Turn] You may trash 1 card with a type including "Rocks Pirates" from your hand: Give up to 1 of your opponent’s Characters −3000 power during this turn.' },
    'OP17-049': { n: 'Charlotte Linlin', kind: 'Character', cost: 5, p: 7000, col: 'blue' },
    'OP17-050': { n: 'Streusen', kind: 'Character', cost: 1, p: 2000, col: 'blue' },
    'OP17-052': { n: 'Don Marlon', kind: 'Character', cost: 3, p: 5000, col: 'blue' },
    'OP17-054': { n: 'Miss Buckingham Stussy', kind: 'Character', cost: 3, p: 5000, col: 'blue' },
    'OP17-055': { n: 'There’s No Authority in the World That Lasts Forever!!!', short: 'There’s No Authority…', kind: 'Event', cost: 0, timing: '[Counter]', ctr: '+2000', col: 'blue' },
    'OP17-056': { n: 'Rocks Pirates', kind: 'Event', cost: 0, timing: '[Counter]', ctr: '+2000', col: 'blue' },
    'OP17-118': { n: 'Rocks.D.Xebec', kind: 'Character', cost: 10, p: 12000, col: 'blue', text: 'If you only have Characters without a Counter, this card in your hand has a +2000 Counter. [On Play] Draw 1 card and play up to 2 {Rocks Pirates} type cards with different card names and a total cost of 9 or less from your hand.' },
    // Kaido (Purple)
    'OP17-058': { n: 'Kaido', kind: 'Leader', p: 5000, col: 'purple', life: 5, text: '[When Attacking]/[On Your Opponent’s Attack] [Once Per Turn] DON!! −1: Give up to 1 of your opponent’s Characters −2000 power during this turn.' },
    'EB04-031': { n: 'King', kind: 'Character', cost: 6, p: 7000, col: 'purple' },
    'EB04-032': { n: 'Queen', kind: 'Character', cost: 1, p: 1000, ctr: '+1000', col: 'purple' },
    'OP07-076': { n: 'Slow-Slow Beam Sword', kind: 'Event', cost: 2, timing: '[Counter]', col: 'purple', kw: ['trigger'] },
    'OP07-077': { n: 'We’re Going to Claim the One Piece!!!', kind: 'Event', cost: 1, timing: '[Main]', col: 'purple', kw: ['trigger'] },
    'OP09-077': { n: 'Gum-Gum Lightning', kind: 'Event', cost: 2, timing: '[Main]', col: 'purple', kw: ['trigger'] },
    'OP15-069': { n: 'Nola', kind: 'Character', cost: 1, p: 2000, ctr: '+2000', col: 'purple' },
    'OP15-078': { n: 'Mamaragan', kind: 'Event', cost: 0, timing: '[Counter]', ctr: '+1000', col: 'purple' },
    'OP17-060': { n: 'Ulti & Page One', kind: 'Character', cost: 6, p: 6000, ctr: '+1000', col: 'purple' },
    'OP17-061': { n: 'Lead Performers', kind: 'Character', cost: 9, p: 11000, col: 'purple' },
    'OP17-062': { n: 'Kaido', kind: 'Character', cost: 10, p: 12000, col: 'purple', kw: ['blocker'] },
    'OP17-063': { n: 'Kaido', kind: 'Character', cost: 10, p: 12000, col: 'purple' },
    'OP17-065': { n: 'Queen', kind: 'Character', cost: 9, p: 10000, col: 'purple', kw: ['banish'] },
    'OP17-073': { n: 'Basil Hawkins', kind: 'Character', cost: 3, p: 1000, ctr: '+2000', col: 'purple' },
    'OP17-074': { n: 'Yamato', kind: 'Character', cost: 3, p: 1000, ctr: '+1000', col: 'purple', kw: ['blocker'] },
    'OP17-075': { n: 'X.Drake', kind: 'Character', cost: 2, p: 2000, ctr: '+2000', col: 'purple' },
    'OP17-076': { n: 'Wo Ro Ro Ro Ro... I Think I’ve Sobered Up', kind: 'Event', cost: 0, timing: '[Counter]', ctr: '+3000', col: 'purple', kw: ['trigger'] },
    'OP17-077': { n: 'Kundali Dragon Swarm', kind: 'Event', cost: 1, timing: '[Counter]', ctr: '+4000', col: 'purple' },
    'EB04-040': { n: 'Flame Dragon Torch', kind: 'Event', cost: 1, timing: '[Counter]', ctr: '+4000', col: 'purple' },
    'ST34-004': { n: 'Charlotte Linlin', kind: 'Character', cost: 10, p: 12000, col: 'purple' },
    // Monkey.D.Luffy OP13-001 (Red/Green), only for E15
    'OP13-001': { n: 'Monkey.D.Luffy', kind: 'Leader', p: 5000, col: 'red', life: 4, colInit: 'R G' },
    'EB04-002': { n: 'Jewelry Bonney', kind: 'Character', cost: 1, p: 2000, ctr: '+1000', col: 'red' },
    'OP14-031': { n: 'Nami', kind: 'Character', cost: 4, p: 2000, ctr: '+1000', col: 'green', kw: ['blocker'] },
    'OP13-027': { n: 'Sanji', kind: 'Character', cost: 5, p: 7000, col: 'green' },
    'OP15-035': { n: 'Laboon', kind: 'Character', cost: 1, p: 2000, ctr: '+2000', col: 'green' },
    'OP04-016': { n: 'Bad Manners Kick Course', kind: 'Event', cost: 0, timing: '[Counter]', ctr: '+3000', col: 'red', kw: ['trigger'] },
    'OP14-022': { n: 'Usopp', kind: 'Character', cost: 4, p: 5000, ctr: '+1000', col: 'green' },
  };
  // Card factory: K('OP17-048', { r: true, don: 2, p: 11000 })
  window.K = function (id, x = {}) {
    const d = D[id];
    if (!d) throw new Error('unknown card ' + id);
    const c = { ...d, cid: id, base: d.p, n: d.short || d.n, full: d.n, ...x };
    if (c.inHandCard) { delete c.inHandCard; }
    // In hand, Characters show their Counter plate; on the field it is hidden (board.md §2.3)
    if (!x.hand && d.kind !== 'Event') delete c.ctr;
    if (x.hand) c.inHand = true;
    if (d.kind === 'Leader') delete c.cost;
    if (!x.hand && d.kind === 'Event') c.ctr = undefined;
    return c;
  };
  window.CARDS = D;
})();

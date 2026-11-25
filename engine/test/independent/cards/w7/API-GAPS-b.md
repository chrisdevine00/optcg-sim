# Wave 7 group B (OP12-036 .. ST36-005): independent test API gaps

Observations the public API and the scripted-card pool did not let a test make.

| # | Card | Gap |
| --- | --- | --- |
| G1 | OP15-093 | `CardView` has no attribute list, so a granted <Slash> attribute cannot be read directly. It is observed through OP12-036 Zoro (a <Slash> attacker cannot K.O. it), which makes that test depend on a second scripted card. |
| G2 | all | Most older scenery (OP01-001, OP02-001, ST01-001, the vanilla Characters, OP02-012 Blenheim) is unscripted: it has no effects and no printed keyword in the engine (a [Blocker] with no script cannot block). Tests use them only as inert Leaders and vanilla Characters and take every [Blocker] from scripted cards (OP04-077 Ideo, OP09-005 Rayleigh). A Leader's own [End of Your Turn] (OP02-001 Edward.Newgate) therefore cannot exercise ST15-001; OP09-075 and OP15-115 are the scripted Life-to-hand sources used instead. |
| G3 | OP14-053 | OP13-003 Gol.D.Roger (Leader) is unscripted, so no Leader whose current power differs from its base power through a static effect exists in the pool; "base power, not current power" is checked with a +3000 Counter instead. |
| G4 | OP13-105 | The order choice is `order` actions naming the card that goes next (instance ids); a test reads the new Life order through `zone()` after the last pick. The looker's private knowledge of the looked-at cards (the `known` map) was not read. |

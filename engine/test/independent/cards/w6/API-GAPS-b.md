# Wave 6 group B (OP10-027 .. ST16-002): independent test API gaps

Observations the public API and the scripted-card pool did not let a test make.

| # | Card | Gap |
| --- | --- | --- |
| G1 | OP11-102 Camie, OP13-106 Conney, OP12-075, OP12-080, OP12-109, OP12-113 | The common cheap [Trigger] scenery (OP01-104 Speed, OP01-009 Carrot, ST01-014 Guard Point) is not scripted, so its [Trigger] cannot be activated: only a scripted [Trigger] works. Tests use OP17-107 Charlotte Daifuku ("[Trigger] Play this card.", scripted) as the [Trigger] source and OP07-076 Slow-Slow Beam Sword (scripted [Counter] Event, DON!! −1) as the Event the opponent activates. |
| G2 | OP11-102 Camie | "[Once Per Turn] is spent even when the If fails" (opponent at 1 Life) cannot be observed: nothing in the scripted pool raises the opponent's Life cheaply in the same turn. |
| G3 | OP12-113 Zoro | A Character K.O.'d in battle on my own turn cannot be built: the attacker is never K.O.'d by a weaker defender (CR 7-1-4), and Zoro has no [Blocker]; only the defending cases (battle and effect) are tested. |

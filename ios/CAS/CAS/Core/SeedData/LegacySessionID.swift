import Foundation

/// Sprint 1/1.5/2 content (séances A/B/C/D/Bras). Sprint 3 replaced these
/// as the app's primary content with CAS V0.1 (see `CASSessionID`) — kept
/// here only so the original files still compile and existing tests can
/// still exercise them. Not reachable from Home, "Toutes les séances", or
/// the rotation anymore; see `SeedSessions.legacy`.
///
/// Was `SeedSessionID` through Sprint 2.1, when it doubled as both "the
/// stable ids" and "the rotation order" for the only sessions that
/// existed. Renamed on the same day CAS V0.1 was introduced, to keep
/// "legacy" and "current" ids from sharing a name that no longer describes
/// either set precisely.
enum LegacySessionID: String, CaseIterable, Sendable {
    case seanceA = "seance-a"
    case seanceB = "seance-b"
    case seanceC = "seance-c"
    case seanceD = "seance-d"
    case bras = "bras"
}

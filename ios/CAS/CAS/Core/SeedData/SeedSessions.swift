import Foundation

/// Note on adaptation tagging: each exercise's `primaryAdaptation` /
/// `secondaryAdaptations` in `Core/SeedData/*.swift` is a first-pass
/// categorization against `10-science/01_THE_PHYSICAL_MODEL.md`, made
/// while porting — not an authoritative analysis. It should be revisited
/// when the Exercise Knowledge Base (20-engine/02) is actually built.
///
/// Sprint 1.5: each session's `format` is an assembly of
/// `CapabilityModuleCatalog` entries — see `20-engine/01_MODULE_ENGINE.md`
/// and the module-choice comment at the top of each session file. The
/// catalog is the stable object; sessions are demo data built on top of
/// it, not the other way around.
///
/// Sprint 3: `primary` is CAS V0.1, built top-down from Action
/// Capabilities per `10-science/04_CAPABILITY_MAPPING.md` — this is what
/// `SeedSessionRepository`, Home, "Toutes les séances" and the rotation
/// show. `legacy` is Sprint 1/1.5/2's A/B/C/D/Bras content: kept
/// compiling and tested, no longer reachable from the app.
enum SeedSessions {
    static let primary: [TrainingSession] = [
        CASForce.session,
        CASPuissance.session,
        CASHypertrophie.session,
        CASRobustesse.session,
        CASBaseAerobie.session,
    ]

    static let legacy: [TrainingSession] = [
        SeanceA.session,
        SeanceB.session,
        SeanceC.session,
        SeanceD.session,
        Bras.session,
    ]

    /// Beta 1.0: native bodyweight-only implementations of CAS Force,
    /// Hypertrophie fonctionnelle and Robustesse's Action Capabilities —
    /// see each file's own doc comment for what's preserved and what's
    /// explicitly not. Deliberately **not** part of `primary` or `all`
    /// yet: nothing in the repository, resolver or rotation selects
    /// between a session's loaded and bodyweight implementation — that
    /// selection logic is a separate, not-yet-designed step. These
    /// compile and are unit-tested like any other seed content, but
    /// aren't reachable from the app.
    static let bodyweightNative: [TrainingSession] = [
        CASForceBodyweight.session,
        CASHypertrophieBodyweight.session,
        CASRobustesseBodyweight.session,
    ]

    static let all: [TrainingSession] = primary + legacy
}

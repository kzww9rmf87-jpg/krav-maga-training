import Foundation

/// The 5 real training sessions, faithfully ported from the web
/// prototype's src/data/*.js. This is Sprint 1's seed data: static,
/// compiled into the app, no backend.
///
/// Note on adaptation tagging: each exercise's `primaryAdaptation` /
/// `secondaryAdaptations` in `Core/SeedData/*.swift` is a first-pass
/// categorization against `10-science/01_THE_PHYSICAL_MODEL.md`, made
/// while porting — not an authoritative analysis. It should be revisited
/// when the Exercise Knowledge Base (20-engine/02) is actually built.
///
/// Sprint 1.5: each session's `format` is now an assembly of
/// `CapabilityModuleCatalog` entries — see `20-engine/01_MODULE_ENGINE.md`
/// and the module-choice comment at the top of each `Seance*.swift` file.
/// The catalog is the stable object; these five sessions are demo data
/// built on top of it, not the other way around.
enum SeedSessions {
    static let all: [TrainingSession] = [
        SeanceA.session,
        SeanceB.session,
        SeanceC.session,
        SeanceD.session,
        Bras.session,
    ]
}

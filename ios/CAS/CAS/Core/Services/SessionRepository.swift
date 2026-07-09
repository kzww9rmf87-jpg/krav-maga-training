import Foundation

/// Where `TrainingSession`s come from. `SeedSessionRepository` is Sprint
/// 1's implementation — a fixed list of real sessions. This protocol is
/// the extension point for the future Decision Engine: it will become a
/// different implementation (one that picks a session based on athlete
/// state rather than returning a static list), and nothing in
/// `Features/Home` will need to change, since it only ever talks to
/// `SessionRepository`.
protocol SessionRepository: Sendable {
    func allSessions() -> [TrainingSession]
    func session(id: String) -> TrainingSession?
}

struct SeedSessionRepository: SessionRepository {
    /// Sprint 3: only CAS V0.1 (`SeedSessions.primary`) — the legacy
    /// A/B/C/D/Bras content stays in the codebase and tests but is no
    /// longer reachable through the repository, so nothing built on top
    /// of it (Home, "Toutes les séances", the rotation) can surface it
    /// by accident.
    func allSessions() -> [TrainingSession] {
        SeedSessions.primary
    }

    func session(id: String) -> TrainingSession? {
        SeedSessions.primary.first { $0.id == id }
    }
}

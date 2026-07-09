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
    func allSessions() -> [TrainingSession] {
        SeedSessions.all
    }

    func session(id: String) -> TrainingSession? {
        SeedSessions.all.first { $0.id == id }
    }
}

import Foundation
import SwiftData

/// A completed training session, persisted locally. This is the CAS
/// equivalent of the web prototype's Carnet history, plus the minimal
/// end-of-session feedback UX.md prescribes (energy, difficulty, pain,
/// comment) — nothing more.
@Model
final class SessionLog {
    var id: UUID
    var sessionId: String
    var sessionTitle: String
    var date: Date
    var energyBefore: Int
    var difficulty: Int
    var pain: Bool
    var painNote: String?
    var comment: String?
    @Relationship(deleteRule: .cascade, inverse: \SetLog.session) var sets: [SetLog]

    init(
        id: UUID = UUID(),
        sessionId: String,
        sessionTitle: String,
        date: Date = Date(),
        energyBefore: Int,
        difficulty: Int,
        pain: Bool,
        painNote: String? = nil,
        comment: String? = nil,
        sets: [SetLog] = []
    ) {
        self.id = id
        self.sessionId = sessionId
        self.sessionTitle = sessionTitle
        self.date = date
        self.energyBefore = energyBefore
        self.difficulty = difficulty
        self.pain = pain
        self.painNote = painNote
        self.comment = comment
        self.sets = sets
    }
}

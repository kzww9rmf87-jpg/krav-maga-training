import Foundation

/// One prescribed row of load/reps. Kept as free text ("50kg", "88-90kg",
/// "+2kg") rather than parsed numbers — this is what the real session data
/// (src/data/seanceA.js etc.) already looks like, and forcing it into a
/// numeric model now would lose information (ranges, relative progressions)
/// with no consumer yet that needs numeric values.
struct SetSpec: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    /// Optional row context from the source data, e.g. "1 — Position 6-7",
    /// "Contrôlé", "Super-set 1", "MAX".
    let label: String?
    let load: String
    let reps: String

    init(id: UUID = UUID(), label: String? = nil, load: String, reps: String) {
        self.id = id
        self.label = label
        self.load = load
        self.reps = reps
    }
}

/// CHAUFFE / TRAVAIL / OPTION from the existing session data.
enum SetGroupKind: String, Codable, Hashable, Sendable {
    case warmup
    case work
    case option
}

/// A labeled group of sets within an exercise (e.g. the warm-up sets, then
/// the work sets).
struct SetGroup: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let kind: SetGroupKind
    let sets: [SetSpec]

    init(id: UUID = UUID(), kind: SetGroupKind, sets: [SetSpec]) {
        self.id = id
        self.kind = kind
        self.sets = sets
    }
}

import Foundation

/// One prescribed row of load/reps. `load` is a `LoadValue` (Alpha 1.1) —
/// hybrid between real numbers ("50kg"), bodyweight variants, qualitative
/// levels (Léger/Modéré/Lourd/Tenue max) and free text, so volume/records/
/// progression can activate only where a real number actually exists
/// rather than guessing one out of "Lourd". `reps` stays free text: reps
/// are always a clean, unambiguous count or a simple range, nothing here
/// has needed a richer model the way load did.
struct SetSpec: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    /// Optional row context from the source data, e.g. "1 — Position 6-7",
    /// "Contrôlé", "Super-set 1", "MAX".
    let label: String?
    let load: LoadValue
    let reps: String

    init(id: UUID = UUID(), label: String? = nil, load: LoadValue, reps: String) {
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

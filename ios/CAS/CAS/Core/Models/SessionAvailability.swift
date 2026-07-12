import Foundation

/// Whether a session can be offered to an athlete given their
/// `availableEquipment` — see `SessionAvailabilityResolver`.
///
/// `.availableWithCompromises` carries no separate `notes` payload on
/// purpose: the UI derives compromise explanations from
/// `resolved.substitutions.filter { $0.equivalence == .partial }`, so
/// there is exactly one source of truth for what changed and why.
enum SessionAvailability: Sendable, Equatable {
    case available(ResolvedTrainingSession)
    case availableWithCompromises(ResolvedTrainingSession)
    case unavailable(reasons: [String])
}

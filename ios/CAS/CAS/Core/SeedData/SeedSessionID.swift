import Foundation

/// The five demo sessions' stable identifiers, defined once. Before this,
/// "seance-a", "bras" etc. were separate string literals in each
/// `Seance*.swift` file, in `RotationRecommendationService`'s rotation
/// order, and in several tests — a typo or rename in any one place would
/// have been a silent runtime bug (e.g. the rotation quietly falling back
/// to Séance A because it no longer recognized an id).
///
/// `CaseIterable`'s declaration order is also the rotation order:
/// A → B → C → D → Bras → (wraps to A). This ties the "stable ids" and
/// "rotation order" together at their single source, rather than
/// asserting them as two facts that could drift apart.
enum SeedSessionID: String, CaseIterable, Sendable {
    case seanceA = "seance-a"
    case seanceB = "seance-b"
    case seanceC = "seance-c"
    case seanceD = "seance-d"
    case bras = "bras"
}

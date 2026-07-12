import Foundation

/// How `HomeView` orchestrates the athlete profile at launch — an explicit
/// state machine rather than independent booleans, so there's exactly one
/// source of truth for "should onboarding be showing right now?" and no
/// window where two independent flags could disagree or trigger two
/// presentations at once.
enum AthleteProfileLoadState: Equatable {
    /// Nothing attempted yet — the very first render, before `HomeView`'s
    /// `.task` runs.
    case idle
    /// A load is in flight.
    case loading
    /// A profile exists and was read successfully.
    case loaded(AthleteProfile)
    /// The store was read successfully and genuinely holds no profile —
    /// the only state that triggers mandatory onboarding.
    case missing
    /// The read itself failed — deliberately distinct from `.missing`.
    /// The associated message is user-facing, not a raw error
    /// description.
    case failed(String)

    /// `nil` unless a profile is actually available to edit — editing must
    /// never start from a freshly-constructed default just because the
    /// load failed.
    var editableProfile: AthleteProfile? {
        if case .loaded(let profile) = self { return profile }
        return nil
    }

    var isMissing: Bool {
        if case .missing = self { return true }
        return false
    }
}

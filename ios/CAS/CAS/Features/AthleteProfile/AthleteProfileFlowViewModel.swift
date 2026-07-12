import Foundation
import Observation

/// Drives the 5-step athlete profile flow, shared identically by
/// onboarding (first launch) and profile editing (from Home's toolbar) —
/// only `mode` and the starting `draft` differ between the two.
@MainActor
@Observable
final class AthleteProfileFlowViewModel {
    enum Mode: Equatable {
        case onboarding
        case edit
    }

    static let stepCount = 5

    let mode: Mode
    /// The in-progress edit. Exposed as a plain `var` (not `private(set)`)
    /// so each step view can bind directly to its own fields via
    /// `@Bindable` — nothing is saved until `finish()` succeeds.
    var draft: AthleteProfile
    private(set) var stepIndex = 0
    private(set) var saveError: String?
    private let store: AthleteProfileStore

    /// `existingProfile` is `nil` only for onboarding. Edit mode always
    /// receives the profile the caller already loaded — this initializer
    /// never fabricates a default profile itself, so a caller can't
    /// accidentally start an edit session from `AthleteProfile()`'s
    /// defaults by passing `nil` where a real profile was expected.
    init(mode: Mode, existingProfile: AthleteProfile?, store: AthleteProfileStore) {
        self.mode = mode
        self.draft = existingProfile ?? AthleteProfile()
        self.store = store
    }

    var isFirstStep: Bool { stepIndex == 0 }
    var isLastStep: Bool { stepIndex == Self.stepCount - 1 }

    func goNext() {
        guard !isLastStep else { return }
        stepIndex += 1
    }

    func goBack() {
        guard !isFirstStep else { return }
        stepIndex -= 1
    }

    /// Returns `true` only on a successful save — the one signal the
    /// presenting view uses to decide whether the flow may close.
    /// `saveError` is cleared on success and set (with the draft left
    /// completely untouched) on failure, so a retry starts from exactly
    /// what the athlete already entered.
    @discardableResult
    func finish() -> Bool {
        do {
            try store.save(draft)
            saveError = nil
            return true
        } catch {
            saveError = "Impossible d'enregistrer votre profil."
            return false
        }
    }

    func clearSaveError() {
        saveError = nil
    }
}

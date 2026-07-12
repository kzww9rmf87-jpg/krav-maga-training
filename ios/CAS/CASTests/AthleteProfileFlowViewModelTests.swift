import Foundation
import Testing
@testable import CAS

@MainActor
private final class FakeAthleteProfileStore: AthleteProfileStore {
    private(set) var savedProfiles: [AthleteProfile] = []
    var shouldThrowOnSave = false

    func load() throws -> AthleteProfile? { nil }

    func save(_ profile: AthleteProfile) throws {
        if shouldThrowOnSave {
            throw NSError(domain: "test", code: 1)
        }
        savedProfiles.append(profile)
    }
}

@MainActor
struct AthleteProfileFlowViewModelTests {

    @Test func onboardingModeStartsFromConservativeDefaultsWhenNoProfileExists() {
        let viewModel = AthleteProfileFlowViewModel(mode: .onboarding, existingProfile: nil, store: FakeAthleteProfileStore())

        #expect(viewModel.mode == .onboarding)
        #expect(viewModel.draft.combatExperience == .beginner)
        #expect(viewModel.draft.trainingEnvironment == .bodyweightOnly)
        #expect(viewModel.draft.availableEquipment.isEmpty)
    }

    @Test func editModeStartsFromTheExactExistingProfileGiven() {
        let existing = AthleteProfile(
            combatExperience: .advanced,
            trainingEnvironment: .combatGym,
            availableEquipment: [.heavyBag],
            kravSessionsPerWeek: 4
        )
        let viewModel = AthleteProfileFlowViewModel(mode: .edit, existingProfile: existing, store: FakeAthleteProfileStore())

        #expect(viewModel.mode == .edit)
        #expect(viewModel.draft == existing)
    }

    @Test func navigationStaysWithinStepBounds() {
        let viewModel = AthleteProfileFlowViewModel(mode: .onboarding, existingProfile: nil, store: FakeAthleteProfileStore())

        #expect(viewModel.isFirstStep)
        viewModel.goBack() // no-op at the first step
        #expect(viewModel.isFirstStep)

        for _ in 0..<10 { viewModel.goNext() } // far past the last step
        #expect(viewModel.isLastStep)

        viewModel.goBack()
        #expect(!viewModel.isLastStep)
    }

    @Test func savingOnlyHappensWhenFinishIsCalled() {
        let store = FakeAthleteProfileStore()
        let viewModel = AthleteProfileFlowViewModel(mode: .onboarding, existingProfile: nil, store: store)

        viewModel.draft.kravSessionsPerWeek = 5
        viewModel.goNext()
        viewModel.draft.primaryGoal = .robustness
        #expect(store.savedProfiles.isEmpty)

        #expect(viewModel.finish() == true)
        #expect(store.savedProfiles.count == 1)
        #expect(store.savedProfiles[0].kravSessionsPerWeek == 5)
        #expect(store.savedProfiles[0].primaryGoal == .robustness)
    }

    @Test func draftIsPreservedAndNoSuccessIsReportedWhenSaveFails() {
        let store = FakeAthleteProfileStore()
        store.shouldThrowOnSave = true
        let viewModel = AthleteProfileFlowViewModel(mode: .onboarding, existingProfile: nil, store: store)
        viewModel.draft.kravSessionsPerWeek = 6

        let succeeded = viewModel.finish()

        #expect(succeeded == false)
        #expect(viewModel.saveError != nil)
        // The draft is exactly what the athlete entered — nothing reset,
        // nothing lost, so a retry doesn't require re-entering anything.
        #expect(viewModel.draft.kravSessionsPerWeek == 6)
        #expect(store.savedProfiles.isEmpty)
    }

    @Test func closingIsOnlyEverReportedAsAllowedAfterASuccessfulSave() {
        // `AthleteProfileFlowView` only calls `onFinished` (which is what
        // actually closes onboarding) when `finish()` returns `true` — so
        // this boolean contract is the entire guarantee that mandatory
        // onboarding can't close on a failed save.
        let store = FakeAthleteProfileStore()
        store.shouldThrowOnSave = true
        let viewModel = AthleteProfileFlowViewModel(mode: .onboarding, existingProfile: nil, store: store)

        #expect(viewModel.finish() == false)

        store.shouldThrowOnSave = false
        #expect(viewModel.finish() == true)
    }
}

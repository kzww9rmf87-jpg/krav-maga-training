import Testing
@testable import CAS

struct AthleteProfileLoadStateTests {

    @Test func loadedStateExposesTheProfilesActualEquipment() {
        let profile = AthleteProfile(availableEquipment: [.kettlebell, .pullUpBar])
        #expect(AthleteProfileLoadState.loaded(profile).equipmentForRecommendation == [.kettlebell, .pullUpBar])
    }

    @Test func loadedStateWithNoDeclaredEquipmentIsGenuinelyAnEmptySet() {
        // Distinguishes "the athlete truly has nothing" from "we don't
        // know yet" — both would otherwise look identical downstream.
        let profile = AthleteProfile(availableEquipment: [])
        #expect(AthleteProfileLoadState.loaded(profile).equipmentForRecommendation == Set<Equipment>())
    }

    @Test func idleStateNeverComputesARecommendation() {
        #expect(AthleteProfileLoadState.idle.equipmentForRecommendation == nil)
    }

    @Test func loadingStateNeverComputesARecommendation() {
        #expect(AthleteProfileLoadState.loading.equipmentForRecommendation == nil)
    }

    @Test func missingStateNeverComputesARecommendation() {
        // Mandatory onboarding covers this state entirely — nothing
        // behind it should compute a personalized recommendation either.
        #expect(AthleteProfileLoadState.missing.equipmentForRecommendation == nil)
    }

    @Test func failedStateIsNeverAssimilatedToEmptyEquipment() {
        // The critical case: a load failure must never look like "the
        // athlete chose bodyweight only" to the recommendation logic.
        #expect(AthleteProfileLoadState.failed("Impossible de charger votre profil.").equipmentForRecommendation == nil)
    }
}

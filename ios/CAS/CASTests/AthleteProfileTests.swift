import Foundation
import Testing
@testable import CAS

struct AthleteProfileTests {

    @Test func defaultInitUsesTheMostConservativeValueInEachCategory() {
        let profile = AthleteProfile()
        #expect(profile.combatExperience == .beginner)
        #expect(profile.strengthTrainingExperience == .beginner)
        #expect(profile.trainingEnvironment == .bodyweightOnly)
        #expect(profile.availableEquipment.isEmpty)
        #expect(profile.primaryGoal == .generalCombatPerformance)
        #expect(profile.secondaryGoals.isEmpty)
        #expect(profile.hasActivePhysicalConstraint == false)
        #expect(profile.kravSessionsPerWeek == 2)
        #expect(profile.casSessionsPerWeek == 2)
        #expect(profile.sessionDurationMinutes == 45)
    }

    @Test func roundTripsThroughJSONWithoutLosingData() throws {
        let original = AthleteProfile(
            combatExperience: .advanced,
            strengthTrainingExperience: .beginner,
            trainingEnvironment: .homeGym,
            availableEquipment: [.kettlebell, .pullUpBar],
            equipmentNotes: "Kettlebell 16kg seulement",
            primaryGoal: .robustness,
            secondaryGoals: [.conditioning, .maximalStrength],
            goalDescription: "Rester solide sur la durée",
            kravSessionsPerWeek: 3,
            casSessionsPerWeek: 2,
            sessionDurationMinutes: 40,
            hasActivePhysicalConstraint: true,
            physicalConstraintNotes: "Épaule droite sensible"
        )

        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(AthleteProfile.self, from: data)

        #expect(decoded.id == original.id)
        #expect(decoded.combatExperience == .advanced)
        #expect(decoded.strengthTrainingExperience == .beginner)
        #expect(decoded.trainingEnvironment == .homeGym)
        #expect(decoded.availableEquipment == [.kettlebell, .pullUpBar])
        #expect(decoded.equipmentNotes == "Kettlebell 16kg seulement")
        #expect(decoded.primaryGoal == .robustness)
        #expect(decoded.secondaryGoals == [.conditioning, .maximalStrength])
        #expect(decoded.goalDescription == "Rester solide sur la durée")
        #expect(decoded.kravSessionsPerWeek == 3)
        #expect(decoded.sessionDurationMinutes == 40)
        #expect(decoded.hasActivePhysicalConstraint == true)
        #expect(decoded.physicalConstraintNotes == "Épaule droite sensible")
        #expect(decoded.createdAt == original.createdAt)
        #expect(decoded.updatedAt == original.updatedAt)
    }

    @Test func decodingAnEmptyPayloadProducesADefaultProfileInsteadOfThrowing() throws {
        let decoded = try JSONDecoder().decode(AthleteProfile.self, from: Data("{}".utf8))

        #expect(decoded.combatExperience == .beginner)
        #expect(decoded.trainingEnvironment == .bodyweightOnly)
        #expect(decoded.primaryGoal == .generalCombatPerformance)
        #expect(decoded.kravSessionsPerWeek == 2)
    }

    @Test func missingFieldsFallBackToDefaultsWhileKnownFieldsStillDecode() throws {
        // Simulates an older payload saved before `sessionDurationMinutes`
        // and `secondaryGoals` existed.
        let json = """
        {
            "id": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
            "combatExperience": "advanced",
            "trainingEnvironment": "combatGym"
        }
        """
        let decoded = try JSONDecoder().decode(AthleteProfile.self, from: Data(json.utf8))

        #expect(decoded.id.uuidString == "3F2504E0-4F89-11D3-9A0C-0305E82C3301")
        #expect(decoded.combatExperience == .advanced)
        #expect(decoded.trainingEnvironment == .combatGym)
        // Never provided in this payload — defaults, not a decode failure.
        #expect(decoded.sessionDurationMinutes == 45)
        #expect(decoded.secondaryGoals.isEmpty)
        #expect(decoded.strengthTrainingExperience == .beginner)
    }

    @Test func anUnrecognizedEnumValueDegradesOnlyThatFieldRatherThanFailingTheWholeDecode() throws {
        let json = """
        {
            "id": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
            "primaryGoal": "somethingFromAFutureVersion",
            "combatExperience": "advanced"
        }
        """
        let decoded = try JSONDecoder().decode(AthleteProfile.self, from: Data(json.utf8))

        // The unrecognized value falls back to the default...
        #expect(decoded.primaryGoal == .generalCombatPerformance)
        // ...without dragging down a sibling field that *was* readable...
        #expect(decoded.combatExperience == .advanced)
        // ...or the identity, which is exactly the "not silently a new
        // profile" guarantee this decoder exists to provide.
        #expect(decoded.id.uuidString == "3F2504E0-4F89-11D3-9A0C-0305E82C3301")
    }

    @Test func identityAndTimestampsSurviveEvenWhenAnotherFieldIsCorrupt() throws {
        let json = """
        {
            "id": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
            "createdAt": 700000000,
            "updatedAt": 700000100,
            "kravSessionsPerWeek": "not a number"
        }
        """
        let decoded = try JSONDecoder().decode(AthleteProfile.self, from: Data(json.utf8))

        #expect(decoded.id.uuidString == "3F2504E0-4F89-11D3-9A0C-0305E82C3301")
        #expect(decoded.createdAt.timeIntervalSinceReferenceDate == 700000000)
        #expect(decoded.updatedAt.timeIntervalSinceReferenceDate == 700000100)
        #expect(decoded.kravSessionsPerWeek == 2) // fell back, didn't throw
    }

    @Test func availableEquipmentKeepsKnownValuesAndDropsOnlyUnknownOnes() throws {
        // The exact example from the brief: an unknown element must not
        // poison the recognized ones around it.
        let json = """
        {
            "id": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
            "availableEquipment": ["barbell", "futureEquipment", "bench"],
            "trainingEnvironment": "homeGym"
        }
        """
        let decoded = try JSONDecoder().decode(AthleteProfile.self, from: Data(json.utf8))

        #expect(decoded.availableEquipment == [.barbell, .bench])
        #expect(decoded.trainingEnvironment == .homeGym)
    }

    @Test func availableEquipmentFallsBackToEmptyOnlyWhenNothingKnownSurvivesOrTheFieldIsAbsent() throws {
        let allUnknown = try JSONDecoder().decode(
            AthleteProfile.self,
            from: Data("""
            { "availableEquipment": ["futureEquipmentOne", "futureEquipmentTwo"] }
            """.utf8)
        )
        #expect(allUnknown.availableEquipment.isEmpty)

        let absent = try JSONDecoder().decode(AthleteProfile.self, from: Data("{}".utf8))
        #expect(absent.availableEquipment.isEmpty)
    }

    @Test func secondaryGoalsKeepsKnownValuesInOrderAndDropsOnlyUnknownOnes() throws {
        let json = """
        {
            "secondaryGoals": ["conditioning", "somethingFromAFutureVersion", "robustness"]
        }
        """
        let decoded = try JSONDecoder().decode(AthleteProfile.self, from: Data(json.utf8))

        #expect(decoded.secondaryGoals == [.conditioning, .robustness])
    }

    @Test func secondaryGoalsFallsBackToEmptyOnlyWhenNothingKnownSurvivesOrTheFieldIsAbsent() throws {
        let allUnknown = try JSONDecoder().decode(
            AthleteProfile.self,
            from: Data("""
            { "secondaryGoals": ["futureGoalOne", "futureGoalTwo"] }
            """.utf8)
        )
        #expect(allUnknown.secondaryGoals.isEmpty)

        let absent = try JSONDecoder().decode(AthleteProfile.self, from: Data("{}".utf8))
        #expect(absent.secondaryGoals.isEmpty)
    }

    // MARK: - Persistence readiness
    // Core/Persistence isn't built yet (next priority), but its planned
    // comma-joined raw-value encoding for Set<Equipment> depends on this
    // holding — worth locking in now, at the source.

    @Test func noEquipmentOrGoalRawValueContainsAComma() {
        #expect(Equipment.allCases.allSatisfy { !$0.rawValue.contains(",") })
        #expect(AthleteGoal.allCases.allSatisfy { !$0.rawValue.contains(",") })
    }
}

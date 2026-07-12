import Foundation
import SwiftData
import Testing
@testable import CAS

@MainActor
struct AthleteProfileStoreTests {

    private func makeContext() -> ModelContext {
        ModelContext(PersistenceController.makeContainer(inMemory: true))
    }

    private func makeStore(context: ModelContext) -> SwiftDataAthleteProfileStore {
        SwiftDataAthleteProfileStore(context: context)
    }

    @Test func loadReturnsNilWhenNoProfileHasEverBeenSaved() throws {
        let store = makeStore(context: makeContext())
        #expect(try store.load() == nil)
    }

    @Test func firstSaveCanBeLoadedBackWithAllFieldsIntact() throws {
        let store = makeStore(context: makeContext())
        let profile = AthleteProfile(
            combatExperience: .advanced,
            strengthTrainingExperience: .intermediate,
            trainingEnvironment: .combatGym,
            availableEquipment: [.heavyBag, .kettlebell, .medicineBall],
            equipmentNotes: "Sac à 30 kg",
            primaryGoal: .gradePreparation,
            secondaryGoals: [.conditioning, .robustness],
            goalDescription: "Ceinture bleue en décembre",
            kravSessionsPerWeek: 3,
            casSessionsPerWeek: 2,
            sessionDurationMinutes: 50,
            hasActivePhysicalConstraint: true,
            physicalConstraintNotes: "Genou droit"
        )

        try store.save(profile)
        let loaded = try #require(try store.load())

        #expect(loaded.id == profile.id)
        #expect(loaded.combatExperience == .advanced)
        #expect(loaded.strengthTrainingExperience == .intermediate)
        #expect(loaded.trainingEnvironment == .combatGym)
        #expect(loaded.availableEquipment == [.heavyBag, .kettlebell, .medicineBall])
        #expect(loaded.equipmentNotes == "Sac à 30 kg")
        #expect(loaded.primaryGoal == .gradePreparation)
        #expect(loaded.secondaryGoals == [.conditioning, .robustness])
        #expect(loaded.goalDescription == "Ceinture bleue en décembre")
        #expect(loaded.kravSessionsPerWeek == 3)
        #expect(loaded.casSessionsPerWeek == 2)
        #expect(loaded.sessionDurationMinutes == 50)
        #expect(loaded.hasActivePhysicalConstraint == true)
        #expect(loaded.physicalConstraintNotes == "Genou droit")
    }

    @Test func savingASecondTimeUpdatesTheSameProfileRatherThanCreatingAnother() throws {
        let context = makeContext()
        let store = makeStore(context: context)
        try store.save(AthleteProfile(kravSessionsPerWeek: 2))
        try store.save(AthleteProfile(kravSessionsPerWeek: 4))

        let all = try context.fetch(FetchDescriptor<AthleteProfileRecord>())
        #expect(all.count == 1)
        #expect(try store.load()?.kravSessionsPerWeek == 4)
    }

    @Test func createdAtIsPreservedAcrossUpdatesEvenIfTheCallerSuppliesADifferentValue() throws {
        let store = makeStore(context: makeContext())
        let first = AthleteProfile(createdAt: Date(timeIntervalSince1970: 1_000_000))
        try store.save(first)
        let originalCreatedAt = try #require(try store.load()).createdAt

        var second = first
        second.kravSessionsPerWeek = 5
        second.createdAt = Date(timeIntervalSince1970: 2_000_000) // deliberately different — must be ignored
        try store.save(second)

        #expect(try store.load()?.createdAt == originalCreatedAt)
    }

    @Test func updatedAtAdvancesOnEverySaveRegardlessOfWhatTheCallerSupplies() throws {
        let store = makeStore(context: makeContext())
        try store.save(AthleteProfile())
        let firstUpdatedAt = try #require(try store.load()).updatedAt

        var second = AthleteProfile()
        second.updatedAt = Date(timeIntervalSince1970: 1) // deliberately stale — must be ignored
        try store.save(second)
        let secondUpdatedAt = try #require(try store.load()).updatedAt

        #expect(secondUpdatedAt > firstUpdatedAt)
    }

    @Test func duplicateRecordsAreClearedOnLoadKeepingTheMostRecentlyUpdated() throws {
        let context = makeContext()
        // Bypasses the store on purpose, to simulate duplicates that
        // shouldn't exist but exceptionally do (a bug, a manual edit).
        let older = AthleteProfileRecord(profile: AthleteProfile(kravSessionsPerWeek: 1))
        older.updatedAt = Date(timeIntervalSinceNow: -3600)
        let newer = AthleteProfileRecord(profile: AthleteProfile(kravSessionsPerWeek: 9))
        newer.updatedAt = Date()
        context.insert(older)
        context.insert(newer)
        try context.save()
        #expect(try context.fetch(FetchDescriptor<AthleteProfileRecord>()).count == 2)

        let store = makeStore(context: context)
        let loaded = try store.load()

        #expect(loaded?.kravSessionsPerWeek == 9)
        #expect(try context.fetch(FetchDescriptor<AthleteProfileRecord>()).count == 1)
    }

    @Test func duplicateRecordsAreAlsoClearedOnSave() throws {
        let context = makeContext()
        let older = AthleteProfileRecord(profile: AthleteProfile(kravSessionsPerWeek: 1))
        older.updatedAt = Date(timeIntervalSinceNow: -3600)
        let newer = AthleteProfileRecord(profile: AthleteProfile(kravSessionsPerWeek: 9))
        newer.updatedAt = Date()
        context.insert(older)
        context.insert(newer)
        try context.save()

        let store = makeStore(context: context)
        try store.save(AthleteProfile(kravSessionsPerWeek: 7))

        let all = try context.fetch(FetchDescriptor<AthleteProfileRecord>())
        #expect(all.count == 1)
        #expect(all.first?.kravSessionsPerWeek == 7)
    }
}

import Foundation
import SwiftData

/// The SwiftData-backed twin of `AthleteProfile`. Each field gets its own
/// typed column — the same discipline `SetLog`/`LoadValue` already
/// established — rather than one opaque blob, so the schema can grow field
/// by field later without a migration. Enum and collection fields are
/// stored as raw-value strings; `Core/Models` never imports SwiftData, so
/// every bit of back-and-forth with `AthleteProfile` lives here, behind
/// exactly two members: `init(profile:)` and `profile`.
@Model
final class AthleteProfileRecord {
    var id: UUID
    var combatExperienceRaw: String
    var strengthTrainingExperienceRaw: String
    var trainingEnvironmentRaw: String
    /// Raw values joined by comma, sorted for a deterministic
    /// representation — a `Set` has no inherent order, so without sorting,
    /// two saves of an identical set could produce different strings.
    /// `Equipment`'s raw values are guaranteed comma-free (see
    /// `AthleteProfileTests.noEquipmentOrGoalRawValueContainsAComma`).
    var availableEquipmentRaw: String
    var equipmentNotes: String?
    var primaryGoalRaw: String
    /// Raw values joined by comma, in `secondaryGoals`' own order — a
    /// list, not a set, so order carries meaning and is never resorted.
    var secondaryGoalsRaw: String
    var goalDescription: String?
    var kravSessionsPerWeek: Int
    var casSessionsPerWeek: Int
    var sessionDurationMinutes: Int
    var hasActivePhysicalConstraint: Bool
    var physicalConstraintNotes: String?
    var createdAt: Date
    var updatedAt: Date

    init(profile: AthleteProfile) {
        id = profile.id
        combatExperienceRaw = profile.combatExperience.rawValue
        strengthTrainingExperienceRaw = profile.strengthTrainingExperience.rawValue
        trainingEnvironmentRaw = profile.trainingEnvironment.rawValue
        availableEquipmentRaw = Self.encodeSorted(profile.availableEquipment)
        equipmentNotes = profile.equipmentNotes
        primaryGoalRaw = profile.primaryGoal.rawValue
        secondaryGoalsRaw = Self.encodeOrdered(profile.secondaryGoals)
        goalDescription = profile.goalDescription
        kravSessionsPerWeek = profile.kravSessionsPerWeek
        casSessionsPerWeek = profile.casSessionsPerWeek
        sessionDurationMinutes = profile.sessionDurationMinutes
        hasActivePhysicalConstraint = profile.hasActivePhysicalConstraint
        physicalConstraintNotes = profile.physicalConstraintNotes
        createdAt = profile.createdAt
        updatedAt = profile.updatedAt
    }

    /// The single bridge back to the domain struct, in both directions.
    /// Unknown raw values (an equipment/goal/enum case from a future
    /// version this build doesn't know about, or a corrupted column)
    /// degrade that one field to its conservative default on read — the
    /// same tolerance `AthleteProfile.init(from:)` applies to JSON.
    /// `AthleteProfileStore` never touches the `*Raw` columns directly; it
    /// only ever reads or assigns this property.
    var profile: AthleteProfile {
        get {
            AthleteProfile(
                id: id,
                combatExperience: TrainingExperience(rawValue: combatExperienceRaw) ?? .beginner,
                strengthTrainingExperience: TrainingExperience(rawValue: strengthTrainingExperienceRaw) ?? .beginner,
                trainingEnvironment: TrainingEnvironment(rawValue: trainingEnvironmentRaw) ?? .bodyweightOnly,
                availableEquipment: Set(Self.decodeList(availableEquipmentRaw) as [Equipment]),
                equipmentNotes: equipmentNotes,
                primaryGoal: AthleteGoal(rawValue: primaryGoalRaw) ?? .generalCombatPerformance,
                secondaryGoals: Self.decodeList(secondaryGoalsRaw),
                goalDescription: goalDescription,
                kravSessionsPerWeek: kravSessionsPerWeek,
                casSessionsPerWeek: casSessionsPerWeek,
                sessionDurationMinutes: sessionDurationMinutes,
                hasActivePhysicalConstraint: hasActivePhysicalConstraint,
                physicalConstraintNotes: physicalConstraintNotes,
                createdAt: createdAt,
                updatedAt: updatedAt
            )
        }
        set {
            id = newValue.id
            combatExperienceRaw = newValue.combatExperience.rawValue
            strengthTrainingExperienceRaw = newValue.strengthTrainingExperience.rawValue
            trainingEnvironmentRaw = newValue.trainingEnvironment.rawValue
            availableEquipmentRaw = Self.encodeSorted(newValue.availableEquipment)
            equipmentNotes = newValue.equipmentNotes
            primaryGoalRaw = newValue.primaryGoal.rawValue
            secondaryGoalsRaw = Self.encodeOrdered(newValue.secondaryGoals)
            goalDescription = newValue.goalDescription
            kravSessionsPerWeek = newValue.kravSessionsPerWeek
            casSessionsPerWeek = newValue.casSessionsPerWeek
            sessionDurationMinutes = newValue.sessionDurationMinutes
            hasActivePhysicalConstraint = newValue.hasActivePhysicalConstraint
            physicalConstraintNotes = newValue.physicalConstraintNotes
            createdAt = newValue.createdAt
            updatedAt = newValue.updatedAt
        }
    }

    private static func encodeSorted(_ values: Set<Equipment>) -> String {
        values.map(\.rawValue).sorted().joined(separator: ",")
    }

    private static func encodeOrdered<T: RawRepresentable>(_ values: [T]) -> String where T.RawValue == String {
        values.map(\.rawValue).joined(separator: ",")
    }

    /// Splits on comma and converts element by element, dropping any raw
    /// value that doesn't match a known case — the same "keep what's
    /// recognized" tolerance as `AthleteProfile`'s own collection
    /// decoding, applied here to the comma-joined storage format.
    private static func decodeList<T: RawRepresentable>(_ raw: String) -> [T] where T.RawValue == String {
        raw.split(separator: ",").compactMap { T(rawValue: String($0)) }
    }
}

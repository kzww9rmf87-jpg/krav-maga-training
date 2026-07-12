import Foundation

/// A single athlete's stable identity, environment, goals and constraints
/// — Beta 1.0's foundation for treating the practitioner as more than an
/// exerciser of a fixed session. Pure struct, no SwiftUI/SwiftData
/// dependency: `Core/Persistence` (not built in this priority) will bridge
/// this to storage, the same way `SetLog` bridges `LoadValue`.
///
/// One profile per installation — there is no multi-athlete concept here,
/// and none is planned; this is a local, single-user app.
struct AthleteProfile: Identifiable, Codable, Sendable, Equatable {
    let id: UUID
    var combatExperience: TrainingExperience
    var strengthTrainingExperience: TrainingExperience
    var trainingEnvironment: TrainingEnvironment
    var availableEquipment: Set<Equipment>
    var equipmentNotes: String?
    var primaryGoal: AthleteGoal
    var secondaryGoals: [AthleteGoal]
    var goalDescription: String?
    var kravSessionsPerWeek: Int
    var casSessionsPerWeek: Int
    var sessionDurationMinutes: Int
    var hasActivePhysicalConstraint: Bool
    var physicalConstraintNotes: String?
    var createdAt: Date
    var updatedAt: Date

    /// Declared explicitly: providing a custom `init(from:)` suppresses
    /// Swift's automatic `CodingKeys` synthesis, so `decoder.container(
    /// keyedBy: CodingKeys.self)` below needs this to exist. Every key
    /// matches its property name — nothing here renames a JSON field.
    private enum CodingKeys: String, CodingKey {
        case id, combatExperience, strengthTrainingExperience, trainingEnvironment
        case availableEquipment, equipmentNotes, primaryGoal, secondaryGoals, goalDescription
        case kravSessionsPerWeek, casSessionsPerWeek, sessionDurationMinutes
        case hasActivePhysicalConstraint, physicalConstraintNotes
        case createdAt, updatedAt
    }

    /// Every parameter defaults to the most conservative value in its
    /// category — beginner over advanced, no equipment assumed, a generic
    /// goal over a specialized one. This is the profile an onboarding flow
    /// starts from and progressively edits, and the fallback state a
    /// partially-corrupt decode degrades to (see `init(from:)` below).
    init(
        id: UUID = UUID(),
        combatExperience: TrainingExperience = .beginner,
        strengthTrainingExperience: TrainingExperience = .beginner,
        trainingEnvironment: TrainingEnvironment = .bodyweightOnly,
        availableEquipment: Set<Equipment> = [],
        equipmentNotes: String? = nil,
        primaryGoal: AthleteGoal = .generalCombatPerformance,
        secondaryGoals: [AthleteGoal] = [],
        goalDescription: String? = nil,
        kravSessionsPerWeek: Int = 2,
        casSessionsPerWeek: Int = 2,
        sessionDurationMinutes: Int = 45,
        hasActivePhysicalConstraint: Bool = false,
        physicalConstraintNotes: String? = nil,
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.combatExperience = combatExperience
        self.strengthTrainingExperience = strengthTrainingExperience
        self.trainingEnvironment = trainingEnvironment
        self.availableEquipment = availableEquipment
        self.equipmentNotes = equipmentNotes
        self.primaryGoal = primaryGoal
        self.secondaryGoals = secondaryGoals
        self.goalDescription = goalDescription
        self.kravSessionsPerWeek = kravSessionsPerWeek
        self.casSessionsPerWeek = casSessionsPerWeek
        self.sessionDurationMinutes = sessionDurationMinutes
        self.hasActivePhysicalConstraint = hasActivePhysicalConstraint
        self.physicalConstraintNotes = physicalConstraintNotes
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    /// Decodes field by field rather than relying on the synthesized
    /// `Decodable` conformance, so a single missing or unrecognized value
    /// (a field added after this payload was saved, or an enum case from a
    /// future version this build doesn't know about yet) degrades that one
    /// field to its default instead of failing the whole profile. Failing
    /// the whole profile would be worse than a wrong field: callers treat
    /// "no profile" as "start onboarding again," silently discarding an
    /// identity that was still recoverable.
    ///
    /// `id`/`createdAt`/`updatedAt` go through the exact same
    /// best-effort-then-default path as every other field — deliberately
    /// not special-cased — so a payload that still has a valid `id` keeps
    /// it even if some other field in the same payload is corrupt.
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = Self.decode(UUID.self, .id, container) ?? UUID()
        combatExperience = Self.decode(TrainingExperience.self, .combatExperience, container) ?? .beginner
        strengthTrainingExperience = Self.decode(TrainingExperience.self, .strengthTrainingExperience, container) ?? .beginner
        trainingEnvironment = Self.decode(TrainingEnvironment.self, .trainingEnvironment, container) ?? .bodyweightOnly
        availableEquipment = Set(Self.decodeKnownRawValues(Equipment.self, .availableEquipment, container) ?? [])
        equipmentNotes = Self.decode(String.self, .equipmentNotes, container)
        primaryGoal = Self.decode(AthleteGoal.self, .primaryGoal, container) ?? .generalCombatPerformance
        secondaryGoals = Self.decodeKnownRawValues(AthleteGoal.self, .secondaryGoals, container) ?? []
        goalDescription = Self.decode(String.self, .goalDescription, container)
        kravSessionsPerWeek = Self.decode(Int.self, .kravSessionsPerWeek, container) ?? 2
        casSessionsPerWeek = Self.decode(Int.self, .casSessionsPerWeek, container) ?? 2
        sessionDurationMinutes = Self.decode(Int.self, .sessionDurationMinutes, container) ?? 45
        hasActivePhysicalConstraint = Self.decode(Bool.self, .hasActivePhysicalConstraint, container) ?? false
        physicalConstraintNotes = Self.decode(String.self, .physicalConstraintNotes, container)
        createdAt = Self.decode(Date.self, .createdAt, container) ?? .now
        updatedAt = Self.decode(Date.self, .updatedAt, container) ?? .now
    }

    /// `nil` whether the key is simply absent (an older payload, a field
    /// added later) or present but unreadable (a future enum case this
    /// build doesn't know about, a corrupted value) — both cases are
    /// indistinguishable in intent here: fall back to the default.
    private static func decode<T: Decodable>(
        _ type: T.Type,
        _ key: CodingKeys,
        _ container: KeyedDecodingContainer<CodingKeys>
    ) -> T? {
        try? container.decodeIfPresent(type, forKey: key)
    }

    /// Decodes a list of raw-value-backed elements one at a time, keeping
    /// every recognized value and silently dropping unrecognized ones —
    /// `decode(_:_:_:)` above can't be reused here because Swift decodes
    /// `[T]`/`Set<T>` as a single unit: one unrecognized raw value inside
    /// would fail the *entire* collection, not just that element, which is
    /// exactly the "no equipment survives one unknown item" bug this fixes.
    /// Reads the field as `[String]` first — always representable — then
    /// converts element by element, so an unknown case (an item from a
    /// future version this build doesn't know about) is simply skipped
    /// instead of poisoning every element around it. `nil` only when the
    /// key is absent or the field isn't even an array of strings; an empty
    /// result because *every* element was unrecognized is a valid `[]`/
    /// `Set()`, not a fallback to `nil`.
    private static func decodeKnownRawValues<T: RawRepresentable>(
        _ type: T.Type,
        _ key: CodingKeys,
        _ container: KeyedDecodingContainer<CodingKeys>
    ) -> [T]? where T.RawValue == String {
        guard let rawValues = try? container.decodeIfPresent([String].self, forKey: key) else { return nil }
        return rawValues.compactMap(T.init(rawValue:))
    }
}
